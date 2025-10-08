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
import { handleCommand } from "./commandHandler.js"; // ✅ Import the central handler

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📦 Load all commands (just for console info)
const commands = new Map();
const commandFiles = fs.readdirSync(path.join(__dirname, "commands")).filter(f => f.endsWith(".js"));
for (const file of commandFiles) {
  const { default: cmd } = await import(`./commands/${file}`);
  commands.set(cmd.name, cmd);
}
console.log(`✅ Loaded ${commands.size} commands.`);

async function startBot() {
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

  // 🔹 Auto pairing code on first start
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

  // 🔄 Connection events
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
      if (reason !== DisconnectReason.loggedOut) startBot(); // Auto restart
    }
  });

  // 💬 Message handler (now using global command handler)
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    // Handle text or caption
    const body =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      msg.message.imageMessage?.caption ||
      "";

    // Forward to the central handler
    await handleCommand(sock, msg, body);
  });
}

startBot();
