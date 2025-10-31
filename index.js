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
import config from "./config.js";
import { isFeatureOn, getSetting } from "./utils/settings.js";
import { isAdmin } from "./utils/isAdmin.js";
import { autoBotConfig } from "./utils/autobot.js";
import { getMode } from "./utils/mode.js";
import { isOwner } from "./utils/isOwner.js";
import { updateActivity } from "./utils/activityTracker.js";
import { games, sendBoard } from "./commands/tictactoe.js";
import {
  isFiltered,
  addFilter,
  isSpam,
  addSpam,
  resetSpam,
} from "./utils/antispam.js";
import checkDependencies from "./utils/checkDependencies.js";

checkDependencies();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🧠 Load commands
const commands = new Map();
const commandFiles = fs.existsSync(path.join(__dirname, "commands"))
  ? fs.readdirSync(path.join(__dirname, "commands")).filter((f) => f.endsWith(".js"))
  : [];

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
      for (const alias of aliases)
        if (!commands.has(alias)) commands.set(alias, cmd);

      console.log(`✅ Loaded command: ${cmd.name}${aliases.length ? ` (${aliases.join(", ")})` : ""}`);
    } catch (err) {
      console.error(`❌ Failed to load command ${file}:`, err.message || err);
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

  // 🧩 Send message wrapper
  const oldSendMessage = sock.sendMessage;
  sock.sendMessage = async function (jid, content = {}, options = {}) {
    try {
      const isInternal =
        ["status@broadcast", "status@newsletter", "broadcast"].some((str) =>
          jid.includes(str)
        ) || jid.startsWith(config.ownerNumber);

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

  // 📱 Pairing
  if (!state.creds.registered) {
    const phoneNumber = process.env.WHATSAPP_NUMBER || config.ownerNumber;
    console.log(`⏳ Requesting pairing code for ${phoneNumber}...`);
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(phoneNumber.trim());
        console.log(`✅ Pairing code: ${code}`);
        console.log("➡️ Link from WhatsApp → Linked Devices → Link with phone number");
      } catch (err) {
        console.error("⚠️ Pairing code error:", err?.message || err);
      }
    }, 3000);
  }

  // 🔄 Connection
  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log("✅ NexOra connected!");
      try {
        await sock.sendMessage(`${config.ownerNumber}@s.whatsapp.net`, {
          text: "🤖 NexOra is back online! Running smoothly ✅",
        });
      } catch {}

      // 🟢 Always online
      setInterval(async () => {
        if (autoBotConfig.alwaysOnline) {
          try {
            await sock.sendPresenceUpdate("available");
          } catch (err) {
            console.error("⚠️ AlwaysOnline error:", err?.message || err);
          }
        }
      }, 15000);
    } else if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      console.log("❌ Connection closed:", reason);
      if (reason !== DisconnectReason.loggedOut) startBot();
    }
  });

  // ---------------------------
  // Message Listener (fixed)
  // ---------------------------
  sock.ev.on("messages.upsert", async ({ messages }) => {
    try {
      const msg = messages?.[0];
      if (!msg || !msg.message) return;

      const fromMe = msg.key.fromMe;
      const sender = msg.key.participant || msg.key.remoteJid;

      // 🧠 Allow owner messages even if fromMe
      if (fromMe && !String(sender).includes(config.ownerNumber)) return;

      const from = msg.key.remoteJid;
      const isGroup = typeof from === "string" && from.endsWith("@g.us");

      const textMsg =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        msg.message.videoMessage?.caption ||
        "";

      if (!isGroup) {
        console.log(`💬 DM message from ${sender}: ${textMsg}`);
      }

      // GROUP FEATURES (antilink, antibadwords)
      if (isGroup) {
        try {
          updateActivity(from, sender);
        } catch (err) {
          console.error("⚠️ updateActivity error:", err);
        }
      }

      const senderIsAdmin = isGroup ? await isAdmin(sock, from, sender) : false;

      const badWords = ["fuck", "bitch", "asshole", "nigga", "bastard", "shit", "pussy"];
      if (isGroup && isFeatureOn(from, "antibadwords")) {
        const lowerText = textMsg.toLowerCase();
        if (badWords.some((w) => lowerText.includes(w)) && !senderIsAdmin) {
          await sock.sendMessage(from, {
            delete: { remoteJid: from, fromMe: false, id: msg.key.id, participant: sender },
          });
          await sock.sendMessage(from, {
            text: `🚫 Bad language not allowed! @${String(sender).split("@")[0]}'s message was deleted.`,
            mentions: [sender],
          });
        }
      }

      // ---------------------------
      // COMMAND HANDLER (DM + GROUP)
      // ---------------------------
      const prefix = ".";
      if (textMsg && textMsg.startsWith(prefix)) {
        const args = textMsg.slice(prefix.length).trim().split(/ +/).filter(Boolean);
        const commandName = (args.shift() || "").toLowerCase();
        if (!commandName) return;

        const command = commands.get(commandName);
        if (!command) return;

        const mode = getMode();
        const isOwnerUser = isOwner(sender);

        if (mode === "private" && !isOwnerUser && isGroup) return;

        if (isFiltered(sender)) {
          await sock.sendMessage(from, { text: "⏳ Please wait before using another command." }, { quoted: msg });
          return;
        }

        addFilter(sender);
        addSpam(sender, spamDB);

        if (isSpam(sender, spamDB)) {
          await sock.sendMessage(from, { text: "🚫 Too many commands. Please slow down." }, { quoted: msg });
          return;
        }

        await command.execute(sock, msg, args, from, sender);
        console.log(`✅ Command executed: ${commandName} by ${sender}`);
      }
    } catch (err) {
      console.error("❌ messages.upsert error:", err);
    }
  });

  // ---------------------------
  // Anti-Delete, Welcome, Goodbye (unchanged)
  // ---------------------------
  sock.ev.on("messages.update", async (updates) => {
    for (const update of updates) {
      try {
        if (update.messageStubType !== 91) continue;

        const jid = update.key.remoteJid;
        if (!jid || !jid.endsWith("@g.us")) continue;

        const setting = getSetting(jid);
        if (!setting?.antidelete) continue;

        const deletedKey = update.key;
        let deletedMsg;
        try {
          deletedMsg = await sock.loadMessage(jid, deletedKey.id);
        } catch (err) {
          console.error("⚠️ Cannot load deleted message:", err?.message || err);
          continue;
        }
        if (!deletedMsg?.message) continue;

        const sender = deletedMsg.key.participant || deletedMsg.key.remoteJid;
        const name = String(sender).split("@")[0];
        const msgType = Object.keys(deletedMsg.message)[0];

        await sock.sendMessage(
          jid,
          {
            text: `⚠️ *Anti-Delete Activated!*\n\n👤 *Sender:* @${name}\n🗂️ *Type:* ${msgType}\n\n📩 Message recovered below 👇`,
            mentions: [sender],
          },
          { quoted: deletedMsg }
        );

        const buffer = await sock.downloadMediaMessage(deletedMsg).catch(() => null);
        if (buffer) {
          const tempFile = `./temp_${Date.now()}`;
          fs.writeFileSync(tempFile, buffer);
          const mediaKey = msgType.replace("Message", "");
          await sock.sendMessage(
            jid,
            {
              [mediaKey]: { url: tempFile },
              caption: deletedMsg.message[msgType].caption || "Recovered deleted media 🗂️",
            },
            { quoted: deletedMsg }
          );
          fs.unlinkSync(tempFile);
        }
      } catch (err) {
        console.error("❌ AntiDelete Error:", err);
      }
    }
  });

  sock.ev.on("group-participants.update", async (update) => {
    try {
      const { id, participants, action } = update;
      for (const participant of participants) {
        if (action === "add" && isFeatureOn(id, "welcome")) {
          await sock.sendMessage(id, {
            text: `👋 Welcome @${participant.split("@")[0]}!`,
            mentions: [participant],
          });
        }
        if (action === "remove" && isFeatureOn(id, "goodbye")) {
          await sock.sendMessage(id, {
            text: `👋 Goodbye @${participant.split("@")[0]}! We’ll miss you 😢`,
            mentions: [participant],
          });
        }
      }
    } catch (err) {
      console.error("❌ group update error:", err);
    }
  });
}

// ✅ Start bot
startBot();
