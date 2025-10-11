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
import { isFeatureOn } from "./utils/settings.js"; // ✅ Import at top

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📦 Load commands
const commands = new Map();
const commandFiles = fs.readdirSync(path.join(__dirname, "commands")).filter(f => f.endsWith(".js"));

async function loadCommands() {
  for (const file of commandFiles) {
    try {
      const { default: cmd } = await import(`./commands/${file}`);
      commands.set(cmd.name, cmd);
    } catch (err) {
      console.error(`❌ Failed to load command ${file}:`, err.message);
    }
  }
  console.log(`✅ Loaded ${commands.size} commands.`);
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
      console.log("✅ NoxOra connected!");
      try {
        await sock.sendMessage("2349160291884@s.whatsapp.net", {
          text: "🤖 *NoxOra is back online!* Running smoothly ✅",
        });
      } catch {}
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

    // 🚨 Anti-link delete
    if (isFeatureOn(from, "antilinkdel")) {
      const urlRegex = /(https?:\/\/[^\s]+)/gi;
      if (urlRegex.test(textMsg)) {
        try {
          await sock.sendMessage(from, {
            delete: {
              remoteJid: from,
              fromMe: false,
              id: msg.key.id,
              participant: sender,
            },
          });
        } catch (err) {
          console.error("❌ Failed to delete link message:", err);
        }
      }
    }

    // 🚨 Anti-link kick
    if (isFeatureOn(from, "antilinkkick")) {
      const urlRegex = /(https?:\/\/[^\s]+)/gi;
      if (urlRegex.test(textMsg)) {
        try {
          await sock.groupParticipantsUpdate(from, [sender], "remove");
          await sock.sendMessage(from, {
            text: `🚫 Link detected! @${sender.split("@")[0]} has been *removed* from the group.`,
            mentions: [sender],
          });
        } catch (err) {
          console.error("❌ Failed to kick user:", err);
        }
      }
    }

    // 🚨 Anti-badwords
    if (isFeatureOn(from, "antibadwords")) {
      const lowerText = textMsg.toLowerCase();
      if (badWords.some(word => lowerText.includes(word))) {
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
            text: `🚫 Bad language is *not allowed*! @${sender.split("@")[0]} message was deleted.`,
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
      try {
        await command.execute(sock, msg, args);
      } catch (err) {
        console.error("❌ Command error:", err);
        await sock.sendMessage(from, { text: "⚠️ Command error occurred." });
      }
    }
  });
}

startBot();
