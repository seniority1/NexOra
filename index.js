// ✅ Use require() instead of import — works on Pterodactyl / CommonJS
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const express = require("express");
const P = require("pino");
const fs = require("fs");
const readline = require("readline");

// 🌐 Simple web server (keeps the bot alive on panel)
const app = express();
const PORT = process.env.PORT || 8080;
app.get("/", (req, res) => res.send("✅ WhatsApp Bot is running"));
app.listen(PORT, () => console.log(`🌐 Web server started on Port ${PORT}`));

// 🧠 Helper for input prompt
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans.trim());
  }));
}

async function startBot() {
  // 🔐 Load or create auth session
  const { state, saveCreds } = await useMultiFileAuthState("./auth_info");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    printQRInTerminal: false, // ❌ no QR
    auth: state,
    logger: P({ level: "silent" }),
    browser: ["Ubuntu", "Chrome", "22.04.4"],
  });

  sock.ev.on("creds.update", saveCreds);

  // 📌 Pairing flow if no session exists
  if (!fs.existsSync("./auth_info/creds.json")) {
    try {
      let number = process.env.PAIRING_NUMBER;
      if (!number) {
        number = await askQuestion("📲 Enter your WhatsApp number with country code (e.g., 2379160291884): ");
      }

      if (!/^\d+$/.test(number)) {
        console.log("❌ Invalid number format. Only digits allowed.");
        process.exit(1);
      }

      const code = await sock.requestPairingCode(number);
      console.log(`\n🔗 Pairing Code for ${number}: ${code}`);
      console.log("👉 Open WhatsApp → Linked Devices → Link a device → Enter this code\n");
    } catch (err) {
      console.error("⚠️ Error while pairing:", err);
      process.exit(1);
    }
  }

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log("✅ BOT CONNECTED SUCCESSFULLY 🎉");
    } else if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        console.log("⚠️ Connection closed, reconnecting...");
        startBot();
      } else {
        console.log("❌ Session logged out. Please restart to pair again.");
      }
    }
  });
}

startBot();
