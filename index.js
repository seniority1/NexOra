// bot.js
import fs from "fs";
import path from "path";
import axios from "axios"; // Added for Webhooks to Dashboard
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

// 🚀 FACTORY SETUP: Get the specific deployment number
const targetNumber = process.argv[2]; 
if (!targetNumber) {
    console.error("❌ No phone number provided! Usage: node bot.js 234...");
    process.exit(1);
}

// 📂 Unique Session Folder per User
const sessionPath = path.join(__dirname, "sessions", targetNumber);
if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

const BACKEND_URL = "https://nexora-backend-qhhc.onrender.com/api/bot";
const SECRET_KEY = "NexOraEmpire2025King";

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

  // Use dynamic session path instead of static "./auth"
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

  // 🧩 Send message wrapper (Modified to use targetNumber as owner)
  const oldSendMessage = sock.sendMessage;
  sock.sendMessage = async function (jid, content = {}, options = {}) {
    try {
      const isInternal =
        ["status@broadcast", "status@newsletter", "broadcast"].some((str) =>
          jid.includes(str)
        ) || jid.startsWith(targetNumber); // Checks against deployment owner

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

  // 📱 Pairing (Dashboard Sync)
  if (!state.creds.registered) {
    console.log(`⏳ Requesting pairing code for ${targetNumber}...`);
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(targetNumber.trim());
        console.log(`✅ Pairing code: ${code}`);
        
        // Notify Render Dashboard of the Pairing Code
        await axios.post(`${BACKEND_URL}/update-code`, {
            phoneNumber: targetNumber,
            pairingCode: code,
            secret: SECRET_KEY
        }).catch(e => console.error("Dashboard Sync Error"));

      } catch (err) {
        console.error("⚠️ Pairing code error:", err?.message || err);
      }
    }, 5000); // 5s delay for stability
  }

  // 🔄 Connection (Dashboard Status Sync)
  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log(`✅ NexOra connected for ${targetNumber}!`);
      
      // Update Dashboard Status to Online
      await axios.post(`${BACKEND_URL}/update-status`, {
          phoneNumber: targetNumber,
          status: "online",
          secret: SECRET_KEY
      }).catch(e => console.error("Status Update Error"));

      try {
        // Send ALIVE message to the user who deployed the bot
        await sock.sendMessage(`${targetNumber}@s.whatsapp.net`, {
          text: `🤖 *NexOra Engine Online!*\n\nHello, your bot instance is successfully deployed and running smoothly. ✅`,
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
      
      if (reason !== DisconnectReason.loggedOut) {
          startBot();
      } else {
          // If logged out manually, notify dashboard
          await axios.post(`${BACKEND_URL}/update-status`, {
              phoneNumber: targetNumber,
              status: "offline",
              secret: SECRET_KEY
          }).catch(e => console.error("Status Update Error"));
      }
    }
  });

  // ---------------------------
  // Message Listener (Owner Logic)
  // ---------------------------
  sock.ev.on("messages.upsert", async ({ messages }) => {
    try {
      const msg = messages?.[0];
      if (!msg || !msg.message) return;

      const fromMe = msg.key.fromMe;
      const sender = msg.key.participant || msg.key.remoteJid;

      // 🧠 Check if sender is the one who deployed the bot
      const isBotOwner = String(sender).includes(targetNumber);

      if (fromMe && !isBotOwner) return;

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

      if (isGroup) {
        try { updateActivity(from, sender); } catch (err) {}
      }

      const senderIsAdmin = isGroup ? await isAdmin(sock, from, sender) : false;

      const badWords = ["fuck", "bitch", "asshole", "nigga", "bastard", "shit", "pussy"];
      if (isGroup && isFeatureOn(from, "antibadwords")) {
        const lowerText = textMsg.toLowerCase();
        if (badWords.some((w) => lowerText.includes(w)) && !senderIsAdmin) {
          await sock.sendMessage(from, {
            delete: { remoteJid: from, fromMe: false, id: msg.key.id, participant: sender },
          });
        }
      }

      // ---------------------------
      // COMMAND HANDLER
      // ---------------------------
      const prefix = ".";
      if (textMsg && textMsg.startsWith(prefix)) {
        const args = textMsg.slice(prefix.length).trim().split(/ +/).filter(Boolean);
        const commandName = (args.shift() || "").toLowerCase();
        if (!commandName) return;

        const command = commands.get(commandName);
        if (!command) return;

        const mode = getMode();
        
        // Owner logic: checks config owner AND deployment owner
        const isOwnerUser = isBotOwner || isOwner(sender);

        if (mode === "private" && !isOwnerUser && isGroup) return;

        if (isFiltered(from, sender)) {
          await sock.sendMessage(from, { text: "⏳ Please wait..." }, { quoted: msg });
          return;
        }

        addFilter(from, sender);
        addSpam(from, sender, spamDB);

        if (isSpam(from, sender, spamDB)) {
          await sock.sendMessage(from, { text: "🚫 Slow down!" }, { quoted: msg });
          return;
        }

        await command.execute(sock, msg, args, from, sender);
      }
    } catch (err) {
      console.error("❌ messages.upsert error:", err);
    }
  });

  // 📸 Auto Status Reaction
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const autoReact = getSetting("autostatreact");
    if (!autoReact) return;
    const msg = messages?.[0];
    if (!msg || msg.key.remoteJid !== "status@broadcast") return;
    try {
      await sock.sendMessage(msg.key.participant, { react: { text: "💚", key: msg.key } });
    } catch (err) {}
  });

  // Anti-Delete
  sock.ev.on("messages.update", async (updates) => {
    for (const update of updates) {
      try {
        if (update.messageStubType !== 91) continue;
        const jid = update.key.remoteJid;
        if (!jid || !jid.endsWith("@g.us")) continue;
        const setting = getSetting(jid);
        if (!setting?.antidelete) continue;
        const deletedMsg = await sock.loadMessage(jid, update.key.id);
        if (!deletedMsg?.message) continue;
        const sender = deletedMsg.key.participant || deletedMsg.key.remoteJid;
        await sock.sendMessage(jid, { text: `⚠️ *Anti-Delete Activated!*`, mentions: [sender] }, { quoted: deletedMsg });
      } catch (err) {}
    }
  });

  sock.ev.on("group-participants.update", async (update) => {
    try {
      const { id, participants, action } = update;
      for (const participant of participants) {
        if (action === "add" && isFeatureOn(id, "welcome")) {
          await sock.sendMessage(id, { text: `👋 Welcome @${participant.split("@")[0]}!`, mentions: [participant] });
        }
      }
    } catch (err) {}
  });
}

// ✅ Start bot engine
startBot();
