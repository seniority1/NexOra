import fs from "fs";
import path from "path";
import axios from "axios"; 
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

// 🚀 FACTORY SETUP
const targetNumber = process.argv[2]; 
if (!targetNumber) {
    console.error("❌ No phone number provided!");
    process.exit(1);
}

const sessionPath = path.join(__dirname, "sessions", targetNumber);
if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

const BACKEND_URL = "https://nexora-backend-qhhc.onrender.com/api/bot";
const SECRET_KEY = "NexOraEmpire2025King";

// 🧠 Load commands
const commands = new Map();
const commandFiles = fs.existsSync(path.join(__dirname, "commands"))
  ? fs.readdirSync(path.join(__dirname, "commands")).filter((f) => f.endsWith(".js"))
  : [];

const spamDB = [];
resetSpam(spamDB);

async function loadCommands() {
  for (const file of commandFiles) {
    try {
      const module = await import(`./commands/${file}`);
      const cmd = module.default;
      const aliases = module.aliases || [];
      if (!cmd || !cmd.name) continue;
      commands.set(cmd.name, cmd);
      for (const alias of aliases)
        if (!commands.has(alias)) commands.set(alias, cmd);
    } catch (err) {}
  }
  console.log(`📘 Total commands loaded: ${commands.size}`);
}

async function startBot() {
  await loadCommands();

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
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

  // 🧩 MESSAGE WRAPPER (Fixed for stability)
  const oldSendMessage = sock.sendMessage;
  sock.sendMessage = async function (jid, content = {}, options = {}) {
    try {
      if (!jid) return;
      const isInternal = ["status@broadcast", "broadcast"].some(s => jid.includes(s));

      if (!isInternal && content && !content.react) {
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
      return await oldSendMessage.call(this, jid, content, options);
    }
  };

  sock.ev.on("creds.update", saveCreds);

  // 📱 PAIRING LOGIC (Retrying enabled)
  if (!state.creds.registered) {
    console.log(`⏳ Requesting pairing code for ${targetNumber}...`);
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(targetNumber.trim());
        console.log(`✅ Pairing code: ${code}`);
        
        const syncDashboard = async (retries = 5) => {
            try {
                await axios.post(`${BACKEND_URL}/update-code`, {
                    phoneNumber: targetNumber,
                    pairingCode: code,
                    secret: SECRET_KEY
                });
                console.log("📡 Dashboard sync successful.");
            } catch (e) {
                if (retries > 0) {
                    console.log(`🔄 Dashboard busy, retrying... (${retries})`);
                    setTimeout(() => syncDashboard(retries - 1), 5000);
                }
            }
        };
        syncDashboard();
      } catch (err) {
        console.error("⚠️ Pairing code error:", err?.message);
      }
    }, 10000); 
  }

  // 🔄 CONNECTION UPDATE
  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log(`✅ NexOra connected for ${targetNumber}!`);
      await axios.post(`${BACKEND_URL}/update-status`, {
          phoneNumber: targetNumber, status: "online", secret: SECRET_KEY
      }).catch(() => {});

      try {
        await sock.sendMessage(`${targetNumber}@s.whatsapp.net`, {
          text: `🤖 *NexOra Engine Online!*\n\nHello, your bot instance is successfully deployed and running smoothly. ✅`,
        });
      } catch {}

      setInterval(async () => {
        if (autoBotConfig.alwaysOnline) {
          try { await sock.sendPresenceUpdate("available"); } catch {}
        }
      }, 15000);
    } else if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
          startBot();
      } else {
          await axios.post(`${BACKEND_URL}/update-status`, {
              phoneNumber: targetNumber, status: "offline", secret: SECRET_KEY
          }).catch(() => {});
      }
    }
  });

  // 📩 MESSAGE HANDLING
  sock.ev.on("messages.upsert", async ({ messages }) => {
    try {
      const msg = messages?.[0];
      if (!msg || !msg.message) return;

      const fromMe = msg.key.fromMe;
      const sender = msg.key.participant || msg.key.remoteJid;
      const isBotOwner = sender && String(sender).includes(targetNumber);

      if (fromMe && !isBotOwner) return;

      const from = msg.key.remoteJid;
      const isGroup = from?.endsWith("@g.us");

      const textMsg =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        msg.message.videoMessage?.caption ||
        "";

      if (isGroup) {
        try { updateActivity(from, sender); } catch {}
      }

      const senderIsAdmin = isGroup ? await isAdmin(sock, from, sender) : false;
      const prefix = ".";

      if (textMsg && textMsg.startsWith(prefix)) {
        const args = textMsg.slice(prefix.length).trim().split(/ +/).filter(Boolean);
        const commandName = (args.shift() || "").toLowerCase();
        const command = commands.get(commandName);

        if (command) {
            const isOwnerUser = isBotOwner || isOwner(sender);
            if (getMode() === "private" && !isOwnerUser && isGroup) return;
            if (isFiltered(from, sender)) return;
            
            addFilter(from, sender);
            addSpam(from, sender, spamDB);
            
            await command.execute(sock, msg, args, from, sender);
        }
      }
    } catch (err) {
      console.error("❌ messages.upsert error:", err.message);
    }
  });

  // 🤖 AUTO-STATUS REACT
  sock.ev.on("messages.upsert", async ({ messages }) => {
    if (getSetting("autostatreact")) {
      const msg = messages?.[0];
      if (msg?.key.remoteJid === "status@broadcast") {
        try { await sock.sendMessage(msg.key.participant, { react: { text: "💚", key: msg.key } }); } catch {}
      }
    }
  });
}

startBot();
