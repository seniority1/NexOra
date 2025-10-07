import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import P from "pino";
import readline from "readline";
import express from "express";

const app = express();
const PORT = process.env.PORT || 8080;
app.get("/", (_, res) => res.send("✅ NoxOra WhatsApp bot is running with pairing login"));
app.listen(PORT, () => console.log(`🌐 Web server started on port ${PORT}`));

const question = (text) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(text, (ans) => {
      rl.close();
      resolve(ans);
    });
  });

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: P({ level: "silent" }),
    printQRInTerminal: false,
    auth: state,
  });

  sock.ev.on("creds.update", saveCreds);

  // 🔥 Generate pairing code only if not already registered
  if (!sock.authState.creds.registered) {
    const number = await question("📞 Enter your WhatsApp number (e.g., 2348123456789): ");
    try {
      console.log("⏳ Generating pairing code...");
      const code = await sock.requestPairingCode(number.trim());
      console.log(`📲 Pair this device by entering this code in WhatsApp: ${code}`);
    } catch (err) {
      console.error("❌ Error generating pairing code:", err);
    }
  }

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "connecting") console.log("🔄 Connecting to WhatsApp...");
    if (connection === "open") console.log("✅ NoxOra connected successfully!");

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = reason !== DisconnectReason.loggedOut;
      console.log("⚠️ Connection closed. Reconnecting:", shouldReconnect);
      if (shouldReconnect) startBot();
    }
  });

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
