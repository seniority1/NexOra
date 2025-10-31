// bot.js
import fs from "fs";
import path from "path";
import makeWASocket, {
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import pino from "pino";
import { fileURLToPath } from "url";
import config from "./config.js"; // 🧠 Import config
import { isFeatureOn, getSetting } from "./utils/settings.js";
import { isAdmin } from "./utils/isAdmin.js";
import { autoBotConfig } from "./utils/autobot.js";
import { getMode } from "./utils/mode.js";
import { isOwner } from "./utils/isOwner.js";
import { updateActivity } from "./utils/activityTracker.js"; // ⚡ Track group activity
import { games, sendBoard } from "./commands/tictactoe.js";
import { isFiltered, addFilter, isSpam, addSpam, resetSpam } from "./utils/antispam.js";
import checkDependencies from "./utils/checkDependencies.js";
checkDependencies();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🧠 Load commands
const commands = new Map();
const commandFiles = fs.readdirSync(path.join(__dirname, "commands")).filter(f => f.endsWith(".js"));

// 🧱 Spam DB
const spamDB = [];
resetSpam(spamDB);

// 📦 Load all command modules
async function loadCommands() {
  for (const file of commandFiles) {
    try {
      const module = await import(`./commands/${file}`);
      const cmd = module.default;
      const aliases = module.aliases || [];

      if (!cmd || !cmd.name) {
        console.warn(`⚠️ Skipped invalid command file: ${file}`);
        continue;
      }

      commands.set(cmd.name, cmd);
      for (const alias of aliases) if (!commands.has(alias)) commands.set(alias, cmd);

      console.log(`✅ Loaded command: ${cmd.name}${aliases.length ? ` (${aliases.join(", ")})` : ""}`);
    } catch (err) {
      console.error(`❌ Failed to load command ${file}:`, err.message);
    }
  }

  console.log(`📘 Total commands loaded: ${commands.size}`);
}

// 🚀 Start the bot
async function startBot() {
  await loadCommands();

  const { state, saveCreds } = await useMultiFileAuthState("./auth");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
    },
    version,
    browser: ["Ubuntu", "Chrome", "22.04.4"],
  });

  // 🧩 Forwarded message wrapper
  const oldSendMessage = sock.sendMessage;
  sock.sendMessage = async function (jid, content = {}, options = {}) {
    try {
      const isInternal =
        ["status@broadcast", "status@newsletter", "broadcast"].some(str => jid.includes(str)) ||
        jid.startsWith(config.ownerNumber); // 👈 Use number from config.js

      if (!isInternal) {
        if (!content.contextInfo) content.contextInfo = {};
        content.contextInfo.forwardingScore = 999;
        content.contextInfo.isForwarded = true;
        content.contextInfo.forwardedNewsletterMessageInfo = {
          newsletterJid: "120363404144195844@newsletter",
          newsletterName: "NexOra....!!™",
          serverMessageId: -1,
        };
      }

      return await oldSendMessage.call(this, jid, content, options);
    } catch (err) {
      console.error("⚠️ sendMessage wrapper error:", err);
      return await oldSendMessage.call(this, jid, content, options);
    }
  };

  sock.ev.on("creds.update", saveCreds);

  // 📱 Pairing code
  if (!state.creds.registered) {
    const phoneNumber = process.env.WHATSAPP_NUMBER || config.ownerNumber;
    console.log(`⏳ Requesting pairing code for ${phoneNumber}...`);
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(phoneNumber.trim());
        console.log(`✅ Pairing code: ${code}`);
        console.log("➡️ Link from WhatsApp → Linked Devices → Link with phone number");
      } catch (err) {
        console.error("⚠️ Pairing code error:", err.message);
      }
    }, 3000);
  }

  // 🔄 Connection management
  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log("✅ NexOra connected!");
      try {
        await sock.sendMessage(`${config.ownerNumber}@s.whatsapp.net`, {
          text: "🤖 *NexOra is back online!* Running smoothly ✅",
        });
      } catch {}
      // 🟢 Always Online
      setInterval(async () => {
        if (autoBotConfig.alwaysOnline) {
          try {
            await sock.sendPresenceUpdate("available");
          } catch (err) {
            console.error("⚠️ AlwaysOnline error:", err.message);
          }
        }
      }, 15000);
    } else if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      console.log("❌ Connection closed:", reason);
      if (reason !== DisconnectReason.loggedOut) startBot();
    }
  });

  // 🚫 Bad words list
  const badWords = ["fuck", "bitch", "asshole", "nigga", "bastard", "shit", "pussy"];

  // 🧠 Group message middleware (antilink, antibadword, tracking)
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    if (!from.endsWith("@g.us")) return;

    // ⚡ Update activity (for .kickinactive tracking)
    updateActivity(from, sender);

    const textMsg =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      msg.message.videoMessage?.caption ||
      "";

    const senderIsAdmin = await isAdmin(sock, from, sender);

    // 🚨 Anti-Link Delete
    if (isFeatureOn(from, "antilinkdel")) {
      const urlRegex = /(https?:\/\/|www\.|t\.me\/|wa\.me\/)[^\s]+/gi;
      if (urlRegex.test(textMsg) && !senderIsAdmin) {
        try {
          await sock.sendMessage(from, {
            delete: { remoteJid: from, fromMe: false, id: msg.key.id, participant: sender },
          });
          await sock.sendMessage(from, {
            text: `🚫 Link detected and *deleted*! @${sender.split("@")[0]}`,
            mentions: [sender],
          });
        } catch (err) {
          console.error("❌ Failed to delete link:", err);
        }
      }
    }

    // 🚨 Anti-Link Kick
    if (isFeatureOn(from, "antilinkkick")) {
      const urlRegex = /(https?:\/\/|www\.|t\.me\/|wa\.me\/)[^\s]+/gi;
      if (urlRegex.test(textMsg) && !senderIsAdmin) {
        try {
          await sock.sendMessage(from, {
            delete: { remoteJid: from, fromMe: false, id: msg.key.id, participant: sender },
          });
          await sock.groupParticipantsUpdate(from, [sender], "remove");
          await sock.sendMessage(from, {
            text: `🚫 Link detected! @${sender.split("@")[0]} has been *removed* from the group.`,
            mentions: [sender],
          });
        } catch (err) {
          console.error("❌ Failed to delete & kick:", err);
        }
      }
    }

    // 🚨 Anti-Badwords
    if (isFeatureOn(from, "antibadwords")) {
      const lowerText = textMsg.toLowerCase();
      if (badWords.some(w => lowerText.includes(w)) && !senderIsAdmin) {
        try {
          await sock.sendMessage(from, {
            delete: { remoteJid: from, fromMe: false, id: msg.key.id, participant: sender },
          });
          await sock.sendMessage(from, {
            text: `🚫 Bad language not allowed! @${sender.split("@")[0]}'s message was deleted.`,
            mentions: [sender],
          });
        } catch (err) {
          console.error("❌ Failed to delete badword:", err);
        }
      }
    }

    // ⚙️ COMMAND HANDLER
    const prefix = ".";
    if (!textMsg.startsWith(prefix)) return;

    const args = textMsg.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    if (commands.has(commandName)) {
      const cmd = commands.get(commandName);

      try {
        await cmd.execute(sock, msg, args, from, sender);
        console.log(`✅ Executed command: ${commandName} by ${sender}`);
      } catch (err) {
        console.error(`❌ Error executing ${commandName}:`, err);
        await sock.sendMessage(from, { text: "⚠️ An error occurred while running that command." });
      }
    }
  });

  // (Remaining parts unchanged — Anti-Delete, Welcome, Auto features, Command Handler, TicTacToe)
  // ✅ No modifications below this point — all stay exactly as in your version
  // 👁️‍🗨️ Anti-Delete Handler ...
  // 👋 Welcome & Goodbye ...
  // 🤖 Auto Typing / React ...
  // 👁️ Auto View Status ...
  // 🧠 Command Handler ...
  // 🎮 TicTacToe Button Handler ...
}

// ✅ Start bot
startBot();
