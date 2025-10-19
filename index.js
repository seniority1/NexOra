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
import { isFeatureOn } from "./utils/settings.js";
import { isAdmin } from "./utils/isAdmin.js"; // ✅ Import admin check
import { autoBotConfig } from "./utils/autobot.js";  // ✅ This was missing
import { getMode } from "./utils/mode.js";
import { isOwner } from "./utils/isOwner.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📦 Load commands
const commands = new Map();
const commandFiles = fs.readdirSync(path.join(__dirname, "commands")).filter(f => f.endsWith(".js"));

// 📦 Load commands with alias support
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

      // 🔁 Register aliases (e.g., .fire, .neon)
      for (const alias of aliases) {
        if (!commands.has(alias)) {
          commands.set(alias, cmd);
        }
      }

      console.log(`✅ Loaded command: ${cmd.name}${aliases.length ? ` (${aliases.join(", ")})` : ""}`);
    } catch (err) {
      console.error(`❌ Failed to load command ${file}:`, err.message);
    }
  }

  console.log(`📘 Total commands loaded: ${commands.size}`);
                   }
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

  // 🧩 Smart "Forwarded from Channel" wrapper for user messages only
const oldSendMessage = sock.sendMessage;
sock.sendMessage = async function (jid, content = {}, options = {}) {
  try {
    // 🧠 Skip internal/system messages (e.g., owner alerts, status)
    const isInternal = [
      "status@broadcast",
      "status@newsletter",
      "broadcast",
    ].some(str => jid.includes(str)) ||
      jid.startsWith("2349160291884"); // 👈 your owner JID (change if needed)

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

    // Continue sending message normally
    return await oldSendMessage.call(this, jid, content, options);
  } catch (err) {
    console.error("⚠️ sendMessage wrapper error:", err);
    return await oldSendMessage.call(this, jid, content, options);
  }
};

  sock.ev.on("creds.update", saveCreds);

  // Pairing code
  if (!state.creds.registered) {
    const phoneNumber = process.env.WHATSAPP_NUMBER || "2349160291884";
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

  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log("✅ NexOra connected!");
      try {
        await sock.sendMessage("2349160291884@s.whatsapp.net", {
          text: "🤖 *NoxOra is back online!* Running smoothly ✅",
        });
      } catch {}
      // 🟢 Always Online Feature
  setInterval(async () => {
    if (autoBotConfig.alwaysOnline) {
      try {
        await sock.sendPresenceUpdate("available");
      } catch (err) {
        console.error("⚠️ AlwaysOnline error:", err.message);
      }
    }
  }, 15000); // every 15 seconds
    } else if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      console.log("❌ Connection closed:", reason);
      if (reason !== DisconnectReason.loggedOut) startBot();
    }
  });

  // 🚫 Bad words list
  const badWords = ["fuck", "bitch", "asshole", "nigga", "bastard", "shit", "pussy"];

  // 🧠 Group message middleware
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    if (!from.endsWith("@g.us")) return;

    const textMsg =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      msg.message.videoMessage?.caption ||
      "";

    // ✅ Check if sender is admin (used for bypass)
    const senderIsAdmin = await isAdmin(sock, from, sender);

    // 🚨 1️⃣ Anti-Link Delete
    if (isFeatureOn(from, "antilinkdel")) {
      const urlRegex = /(https?:\/\/|www\.|t\.me\/|wa\.me\/)[^\s]+/gi;
      if (urlRegex.test(textMsg) && !senderIsAdmin) {
        try {
          await sock.sendMessage(from, {
            delete: {
              remoteJid: from,
              fromMe: false,
              id: msg.key.id,
              participant: sender,
            },
          });
          await sock.sendMessage(from, {
            text: `🚫 Link detected and *deleted*! @${sender.split("@")[0]}`,
            mentions: [sender],
          });
        } catch (err) {
          console.error("❌ Failed to delete link message:", err);
        }
      }
    }

    // 🚨 2️⃣ Anti-Link Kick (Delete first → then kick)
    if (isFeatureOn(from, "antilinkkick")) {
      const urlRegex = /(https?:\/\/|www\.|t\.me\/|wa\.me\/)[^\s]+/gi;
      if (urlRegex.test(textMsg) && !senderIsAdmin) {
        try {
          // 🧹 Delete the message first
          await sock.sendMessage(from, {
            delete: {
              remoteJid: from,
              fromMe: false,
              id: msg.key.id,
              participant: sender,
            },
          });

          // 👢 Kick the sender
          await sock.groupParticipantsUpdate(from, [sender], "remove");
          await sock.sendMessage(from, {
            text: `🚫 Link detected! @${sender.split("@")[0]} has been *removed* from the group.`,
            mentions: [sender],
          });
        } catch (err) {
          console.error("❌ Failed to delete and kick:", err);
        }
      }
    }

    // 🚨 3️⃣ Anti-Badwords (Admin Bypass)
    if (isFeatureOn(from, "antibadwords")) {
      const lowerText = textMsg.toLowerCase();
      if (badWords.some(word => lowerText.includes(word)) && !senderIsAdmin) {
        try {
          await sock.sendMessage(from, {
            delete: {
              remoteJid: from,
              fromMe: false,
              id: msg.key.id,
              participant: sender,
            },
          });

          await sock.sendMessage(from, {
            text: `🚫 Bad language is *not allowed*! @${sender.split("@")[0]}'s message was deleted.`,
            mentions: [sender],
          });
        } catch (err) {
          console.error("❌ Failed to delete badword message:", err);
        }
      }
    }
  });

  // 👋 Welcome & Goodbye
  sock.ev.on("group-participants.update", async (update) => {
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
  });

    // 🤖 Auto Typing / Auto Recording / Auto Read / Auto React
sock.ev.on("messages.upsert", async ({ messages }) => {
  const msg = messages[0];
  if (!msg.message) return;
  const from = msg.key.remoteJid;

  if (autoBotConfig.autoTyping) {
    await sock.sendPresenceUpdate("composing", from);
  }

  if (autoBotConfig.autoRecording) {
    await sock.sendPresenceUpdate("recording", from);
  }

  if (autoBotConfig.autoRead) {
    await sock.readMessages([msg.key]);
  }

  if (autoBotConfig.autoReact && !msg.key.fromMe) {
    const emojis = ["😊", "😘", "💕", "😎", "✅", "💯"];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    await sock.sendMessage(from, {
      react: { text: randomEmoji, key: msg.key },
    });
  }
});

// 👁️ Auto View Status (bulk)
sock.ev.on("chats.update", async (updates) => {
  if (!autoBotConfig.autoViewStatus) return;

  for (const chat of updates) {
    if (chat.id?.endsWith("@status")) {
      try {
        const statusJid = chat.id;
        const messages = await sock.fetchStatus(statusJid);
        if (messages && messages.length > 0) {
          for (const status of messages) {
            await sock.readMessages([{ ...status.key }]);
          }
          console.log(`👁️ Auto-viewed ${messages.length} status updates from ${statusJid}`);
        }
      } catch (err) {
        console.error("❌ AutoViewStatus error:", err);
      }
    }
  }
});

// 👁️ Auto View Status (real-time)
sock.ev.on("messages.upsert", async ({ messages }) => {
  const msg = messages[0];
  if (!msg || !msg.key) return;

  if (autoBotConfig.autoViewStatus && msg.key.remoteJid === "status@broadcast") {
    try {
      await sock.readMessages([msg.key]);
      console.log(`👁️ Auto-viewed a status from ${msg.key.participant}`);
    } catch (err) {
      console.error("❌ Failed to auto-view status:", err);
    }
  }
});
  // 🧠 Command handler
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const from = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
    if (!text.startsWith(".")) return;

    const args = text.trim().slice(1).split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = commands.get(commandName);
    if (command) {
      try { // 🔐 Mode system check
const sender = msg.key.participant || msg.key.remoteJid;
const mode = getMode();

// If bot is in private mode and user is not owner → ignore
if (mode === "private" && !isOwner(sender)) {
  return; // 🚫 Ignore non-owner commands silently
}
        await command.execute(sock, msg, args);
      } catch (err) {
        console.error("❌ Command error:", err);
        await sock.sendMessage(from, { text: "⚠️ Command error occurred." });
      }
    }
  });
}

startBot();
