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
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

// Utilities & Logic
import { isFeatureOn, getSetting } from "./utils/settings.js";
import { isAdmin } from "./utils/isAdmin.js";
import { autoBotConfig } from "./utils/autobot.js";
import { getMode } from "./utils/mode.js";
import { updateActivity } from "./utils/activityTracker.js";
import { isFiltered, addFilter, isSpam, addSpam, resetSpam } from "./utils/antispam.js";
import checkDependencies from "./utils/checkDependencies.js";

checkDependencies();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🧠 Global Store for Sessions
const sessions = new Map();
const commands = new Map();
const spamDB = [];
resetSpam(spamDB);

// 📦 Load all command modules (Shared across all bots to save RAM)
async function loadCommands() {
  const commandFiles = fs.existsSync(path.join(__dirname, "commands"))
    ? fs.readdirSync(path.join(__dirname, "commands")).filter((f) => f.endsWith(".js"))
    : [];

  for (const file of commandFiles) {
    try {
      const module = await import(`./commands/${file}`);
      const cmd = module.default;
      if (!cmd || !cmd.name) continue;
      commands.set(cmd.name, cmd);
      if (module.aliases) {
        module.aliases.forEach(alias => commands.set(alias, cmd));
      }
    } catch (err) {
      console.error(`❌ Load Error ${file}:`, err.message);
    }
  }
  console.log(`📘 Total commands loaded: ${commands.size}`);
}

// 🚀 Core Bot Creator
async function createBotInstance(phoneNumber, io) {
  const authDir = `./sessions/${phoneNumber}`;
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
    },
    version,
    browser: ["NexOra Dashboard", "Chrome", "1.0.0"],
  });

  sessions.set(phoneNumber, sock);

  // 🧩 Dynamic Message Wrapper
  const oldSendMessage = sock.sendMessage;
  sock.sendMessage = async function (jid, content = {}, options = {}) {
    try {
      const botId = sock.user.id.split(":")[0] + "@s.whatsapp.net";
      const isInternal = [botId, "status@broadcast"].some(id => jid.includes(id));

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
      return await oldSendMessage.call(this, jid, content, options);
    }
  };

  // 📱 Pairing Code Logic
  if (!state.creds.registered) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(phoneNumber);
        io.emit(`pairing-code-${phoneNumber}`, { code });
        console.log(`📡 Code for ${phoneNumber}: ${code}`);
      } catch (err) {
        io.emit(`error-${phoneNumber}`, "Pairing request failed.");
      }
    }, 5000);
  }

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log(`✅ NexOra: ${phoneNumber} is LIVE`);
      io.emit(`status-${phoneNumber}`, { state: "connected" });
      
      const botOwner = sock.user.id.split(":")[0] + "@s.whatsapp.net";
      await sock.sendMessage(botOwner, { text: "🚀 *NexOra Platform:* Your bot is successfully deployed!" });

    } else if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        createBotInstance(phoneNumber, io);
      } else {
        sessions.delete(phoneNumber);
        io.emit(`status-${phoneNumber}`, { state: "logged_out" });
      }
    }
  });

  // 📥 Message Listener (Dynamic Owner Check)
  sock.ev.on("messages.upsert", async ({ messages }) => {
    try {
      const msg = messages?.[0];
      if (!msg || !msg.message) return;

      const botOwnerId = sock.user.id.split(":")[0];
      const fromMe = msg.key.fromMe;
      const sender = msg.key.participant || msg.key.remoteJid;
      const isOwnerUser = String(sender).includes(botOwnerId);

      if (fromMe && !isOwnerUser) return;

      const from = msg.key.remoteJid;
      const isGroup = from.endsWith("@g.us");
      const textMsg = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

      // Group Features & Command Handling
      if (isGroup) updateActivity(from, sender);

      const prefix = ".";
      if (textMsg.startsWith(prefix)) {
        const args = textMsg.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = commands.get(commandName);

        if (command) {
          if (getMode() === "private" && !isOwnerUser) return;
          if (isFiltered(from, sender)) return;
          
          addFilter(from, sender);
          addSpam(from, sender, spamDB);

          await command.execute(sock, msg, args, from, sender);
        }
      }
    } catch (err) { console.error("Msg Error:", err); }
  });
}

// 🌐 API & Deployment Bridge
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

app.use(express.json());

io.on("connection", (socket) => {
  socket.on("deploy-bot", async (data) => {
    const { phoneNumber } = data;
    if (!phoneNumber) return;
    await createBotInstance(phoneNumber, io);
  });
});

// Start Everything
loadCommands().then(() => {
  httpServer.listen(3000, () => console.log("💎 NexOra Engine running on Port 3000"));
});
