import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";
import P from "pino";
import express from "express";
import readline from "readline";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 8080;
app.get("/", (_, res) => res.send("✅ WhatsApp bot is running"));
app.listen(PORT, () => console.log(`🌐 Web server started on port ${PORT}`));

// 🧠 Helper to ask questions in console
async function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth_info");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    auth: state,
    version,
    logger: P({ level: "silent" }),
    printQRInTerminal: false,
    browser: ["Baileys", "Chrome", "1.0.0"] // ✅ clean simple fingerprint
  });

  sock.ev.on("creds.update", saveCreds);

  // ✅ Pairing only once if session doesn't exist yet
  if (!fs.existsSync("./auth_info/creds.json")) {
    console.log("📲 No existing session found. Using pairing code login...");
    const phoneNumber = await askQuestion("📞 Enter your WhatsApp number (e.g. 2348012345678): ");

    if (!/^\d+$/.test(phoneNumber)) {
      console.log("❌ Invalid phone number. Digits only.");
      process.exit(1);
    }

    try {
      const code = await sock.requestPairingCode(phoneNumber);
      console.log(`\n🔐 Your pairing code: ${code}`);
      console.log("👉 Enter this code in WhatsApp: Settings > Linked devices > Link with phone number\n");
    } catch (err) {
      console.error("⚠️ Failed to generate pairing code:", err);
      process.exit(1);
    }
  }

  // 📡 Connection updates
  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log("✅ Bot connected to WhatsApp successfully!");
    } else if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("⚠️ Connection closed. Reconnecting:", shouldReconnect);
      if (shouldReconnect) startBot();
      else console.log("❌ Session logged out. Restart bot to pair again.");
    }
  });

  // 📨 Simple ping command
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    if (text.trim().toLowerCase() === ".ping") {
      await sock.sendMessage(msg.key.remoteJid, { text: "🏓 Pong!" });
    }
  });
}

startBot();
