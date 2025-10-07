// index.js
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";
import P from "pino";
import express from "express";

const app = express();
const PORT = process.env.PORT || 8080;
app.get("/", (_, res) => res.send("✅ NoxOra WhatsApp bot is running"));
app.listen(PORT, () => console.log(`🌐 Web server started on port ${PORT}`));

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const { version } = await fetchLatestBaileysVersion();

  // 🔧 Change this number to yours (include country code, no + sign)
  const phoneNumber = process.env.WA_PHONE || "2349160291884";

  const sock = makeWASocket({
    version,
    logger: P({ level: "silent" }),
    printQRInTerminal: false, // ❌ No QR
    auth: state,
  });

  sock.ev.on("creds.update", saveCreds);

  // Pairing logic (only runs once if not registered)
  if (!sock.authState.creds.registered) {
    console.log("📞 Using WhatsApp number:", phoneNumber);
    try {
      const code = await sock.requestPairingCode(phoneNumber);
      console.log(`📲 Pair this device on your WhatsApp app → Linked Devices → Link with code`);
      console.log(`🔢 Enter this code: ${code}`);
    } catch (err) {
      console.error("❌ Error getting pairing code:", err);
    }
  }

  // Connection updates
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "open") {
      console.log("✅ NoxOra connected to WhatsApp!");
    } else if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = reason !== DisconnectReason.loggedOut;
      console.log("⚠️ Connection closed. Reconnecting:", shouldReconnect);
      if (shouldReconnect) startBot();
    }
  });

  // Example command
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    if (text.trim().toLowerCase() === ".ping") {
      await sock.sendMessage(msg.key.remoteJid, { text: "🏓 Pong! NoxOra is alive." });
    }
  });
}

startBot();
