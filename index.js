import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";
import P from "pino";
import express from "express";

const app = express();
const PORT = process.env.PORT || 8080;
app.get("/", (_, res) => res.send("✅ WhatsApp bot is running on panel"));
app.listen(PORT, () => console.log(`🌐 Web server started on port ${PORT}`));

async function startBot() {
  // ✅ Auth folder to store login session
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");

  // ✅ Always get latest Baileys version
  const { version } = await fetchLatestBaileysVersion();
  console.log(`📡 Using Baileys version: ${version}`);

  const sock = makeWASocket({
    auth: state,
    version,
    printQRInTerminal: true,
    logger: P({ level: "silent" })
  });

  // Save session when credentials update
  sock.ev.on("creds.update", saveCreds);

  // Handle connection updates (login / reconnect)
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "open") {
      console.log("✅ Bot connected to WhatsApp!");
    } else if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("⚠️ Connection closed. Reconnecting:", shouldReconnect);
      if (shouldReconnect) startBot();
    }
  });

  // Handle incoming messages
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
