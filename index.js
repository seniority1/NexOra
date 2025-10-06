import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";
import P from "pino";
import express from "express";
import readline from "readline";

const app = express();
const PORT = process.env.PORT || 8080;
app.get("/", (_, res) => res.send("✅ WhatsApp bot is running"));
app.listen(PORT, () => console.log(`🌐 Web server started on port ${PORT}`));

async function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    auth: state,
    version,
    logger: P({ level: "silent" }),
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    // If there are no creds yet, use pairing code login
    if (!state.creds?.registered && !sock.authState.creds.registered) {
      console.log("📲 No existing session found. Using pairing code login...");
      const phoneNumber = await askQuestion("📞 Enter your WhatsApp number (e.g. 2348012345678): ");
      const code = await sock.requestPairingCode(phoneNumber);
      console.log(`🔐 Your pairing code: ${code}`);
      console.log("👉 Enter this code in WhatsApp: Settings > Linked devices > Link with phone number");
    }

    if (connection === "open") {
      console.log("✅ Bot connected to WhatsApp!");
    } else if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
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
      await sock.sendMessage(msg.key.remoteJid, { text: "🏓 Pong!" });
    }
  });
}

startBot();
