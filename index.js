// index.js — dynamic multi-user friendly NexOra bot entrypoint
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import makeWASocket, {
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import pino from "pino";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------
//  CONFIG / ENV / PATHS
// ---------------------------
// BOT_CONFIG_DIR : where config.js lives (default: current folder)
// BOT_SESSION_DIR: where auth/session is saved (default: ./auth)
// OWNER_NUMBER   : optional override for owner number (without @s.whatsapp.net)
const CONFIG_DIR = process.env.BOT_CONFIG_DIR ? path.resolve(process.env.BOT_CONFIG_DIR) : process.cwd();
const SESSION_DIR = process.env.BOT_SESSION_DIR ? path.resolve(process.env.BOT_SESSION_DIR) : path.join(process.cwd(), "auth");
const OWNER_NUMBER_OVERRIDE = process.env.OWNER_NUMBER || null;

// try-load config.js (must export default)
async function loadConfig() {
  const configFile = path.join(CONFIG_DIR, "config.js");
  if (!fs.existsSync(configFile)) {
    throw new Error(`config.js not found in ${CONFIG_DIR}`);
  }
  const moduleUrl = pathToFileURL(configFile).href;
  const mod = await import(moduleUrl);
  return mod.default || mod;
}

// ---------------------------
//  COMMANDS & UTILITIES LOADER
// ---------------------------
async function loadCommands(commandsMap, commandsDir) {
  commandsMap.clear();
  if (!fs.existsSync(commandsDir)) return;
  const files = fs.readdirSync(commandsDir).filter((f) => f.endsWith(".js"));
  for (const file of files) {
    try {
      const mod = await import(pathToFileURL(path.join(commandsDir, file)).href);
      const cmd = mod.default;
      const aliases = mod.aliases || [];
      if (!cmd || !cmd.name) continue;
      commandsMap.set(cmd.name, cmd);
      for (const a of aliases) if (!commandsMap.has(a)) commandsMap.set(a, cmd);
      console.log(`Loaded command: ${cmd.name}${aliases.length ? ` (${aliases.join(", ")})` : ""}`);
    } catch (e) {
      console.error(`Failed to load command ${file}:`, e?.message || e);
    }
  }
}

// ---------------------------
//  MAIN bot starter
// ---------------------------
async function startBot() {
  // Load per-instance config
  const config = await loadConfig();

  // allow override for owner number (used across your code)
  const OWNER_NUMBER = OWNER_NUMBER_OVERRIDE || config.ownerNumber;

  // commands path relative to CONFIG_DIR (so each user's commands live in their folder)
  const COMMANDS_DIR = path.join(CONFIG_DIR, "commands");

  // ensure session dir exists
  if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

  // load commands
  const commands = new Map();
  await loadCommands(commands, COMMANDS_DIR);
  console.log(`Total commands loaded: ${commands.size}`);

  // spam DB helper (same pattern you used)
  const spamDB = [];
  // If you have a resetSpam util, call it here; else keep simple array

  // Load baileys version
  const { version } = await fetchLatestBaileysVersion();

  // Use per-instance auth dir (SESSION_DIR)
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

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

  // === message send wrapper (kept from your original)
  const oldSendMessage = sock.sendMessage.bind(sock);
  sock.sendMessage = async function (jid, content = {}, options = {}) {
    try {
      const isInternal =
        ["status@broadcast", "status@newsletter", "broadcast"].some((str) => jid.includes(str)) ||
        jid.startsWith(OWNER_NUMBER);

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

      return await oldSendMessage(jid, content, options);
    } catch (e) {
      console.error("sendMessage wrapper error:", e?.message || e);
      return await oldSendMessage(jid, content, options);
    }
  };

  // Pairing helper - NOTE: factory / deployer will normally handle pairing.
  // This helper attempts requesting a pairing code using the existing socket.
  // Call from external process by invoking a short-lived script that sets
  // BOT_SESSION_DIR to the user's auth dir and calls this function (or
  // create an endpoint in your factory that spawns this script).
  async function requestPairing(phoneNumber) {
    if (!phoneNumber) throw new Error("phoneNumber required");
    if (!/^\d{10,15}$/.test(phoneNumber)) throw new Error("Invalid phoneNumber");

    if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

    // If already registered, bail out
    try {
      const credsPath = path.join(SESSION_DIR, "creds.json");
      if (fs.existsSync(credsPath)) {
        const creds = JSON.parse(fs.readFileSync(credsPath));
        if (creds.registered) return { alreadyLinked: true };
      }
    } catch {}

    // Ensure socket is ready
    await new Promise((r) => setTimeout(r, 800));
    // request pairing code
    const code = await sock.requestPairingCode(phoneNumber.trim());
    return { pairingCode: code };
  }

  // Connection handling
  sock.ev.on("connection.update", async (update) => {
    try {
      const { connection, lastDisconnect } = update;
      if (connection === "open") {
        console.log("✅ NexOra connected!");
        // announce to owner if available
        try {
          if (OWNER_NUMBER) {
            await sock.sendPresenceUpdate("available");
            await sock.sendMessage(`${OWNER_NUMBER}@s.whatsapp.net`, { text: "🤖 NexOra is back online!" });
          }
        } catch {}
      } else if (connection === "close") {
        const reason = lastDisconnect?.error?.output?.statusCode;
        console.log("❌ Connection closed:", reason);
        if (reason !== DisconnectReason.loggedOut) {
          // restart logic: small delay then re-run startBot by exiting process (pm2 will restart)
          console.log("Attempting restart (exit to let PM2 restart instance)...");
          process.exit(1);
        } else {
          console.log("Logged out — manual intervention required for this instance.");
        }
      }
    } catch (e) {
      console.error("connection.update error:", e?.message || e);
    }
  });

  // Messages listener (kept structure from your original)
  sock.ev.on("messages.upsert", async ({ messages }) => {
    try {
      const msg = messages?.[0];
      if (!msg || !msg.message) return;

      const fromMe = msg.key.fromMe;
      const sender = msg.key.participant || msg.key.remoteJid;
      if (fromMe && !String(sender).includes(OWNER_NUMBER)) return;

      const from = msg.key.remoteJid;
      const isGroup = typeof from === "string" && from.endsWith("@g.us");

      const textMsg =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        msg.message.videoMessage?.caption ||
        "";

      if (!isGroup) console.log(`DM from ${sender}: ${textMsg}`);

      // anti-badwords / group handling - keep your existing utilities (import them if present)
      // Example command handling:
      const prefix = ".";
      if (textMsg && textMsg.startsWith(prefix)) {
        const args = textMsg.slice(prefix.length).trim().split(/ +/).filter(Boolean);
        const commandName = (args.shift() || "").toLowerCase();
        if (!commandName) return;

        const command = commands.get(commandName);
        if (!command) return;

        // basic anti-spam / filtering hooks would go here (you can reuse your existing functions)
        try {
          await command.execute(sock, msg, args, from, sender);
          console.log(`Executed command ${commandName} by ${sender}`);
        } catch (err) {
          console.error("command execute error:", err?.message || err);
        }
      }
    } catch (err) {
      console.error("messages.upsert error:", err?.message || err);
    }
  });

  // Example additional events (group participants / messages.update) preserved in the same way as your original
  sock.ev.on("group-participants.update", async (update) => {
    try {
      const { id, participants, action } = update;
      for (const participant of participants) {
        if (action === "add") {
          await sock.sendMessage(id, { text: `Welcome @${participant.split("@")[0]}!`, mentions: [participant] });
        }
      }
    } catch (e) {
      console.error("group-participants.update error:", e?.message || e);
    }
  });

  // export pairing helper onto global so the deployer script can call it if needed
  // (when running under PM2, you can spawn a tiny node script that imports this file
  // or call an external factory API that launches a short-lived pairing worker.)
  global.__NEXORA_REQUEST_PAIRING = requestPairing;

  console.log("NexOra bot started for folder:", CONFIG_DIR);
  console.log("Session dir:", SESSION_DIR);
  console.log("Owner number:", OWNER_NUMBER ? OWNER_NUMBER : "(from config.js)");

  return { sock, requestPairing };
}

// Start if run directly
if (import.meta.url === pathToFileURL(process.argv[1] || "").href || !process.env.NODE_WORKER_ID) {
  // run the bot
  startBot().catch((e) => {
    console.error("Fatal start error:", e?.message || e);
    process.exit(1);
  });
}

export default startBot;
