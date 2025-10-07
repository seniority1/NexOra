import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from "@whiskeysockets/baileys";
import P from "pino";
import express from "express";

const app = express();
const PORT = process.env.PORT || 8080;
app.get("/", (_, res) => res.send("✅ NoxOra WhatsApp bot is running with pairing login"));
app.listen(PORT, () => console.log(`🌐 Web server started on port ${PORT}`));

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, P({ level: "silent" })),
    },
    logger: P({ level: "silent" }),
    printQRInTerminal: false, // 🚫 Disable QR
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, isNewLogin, pairingCode } = update;

    if (connection === "connecting") {
      console.log("🔄 Connecting to WhatsApp...");
    }

    if (isNewLogin) {
      console.log("🆕 New login detected, generating pairing code...");
      try {
        const code = await sock.requestPairingCode("234XXXXXXXXXX"); // ☑️ Replace with your phone number (with country code, no '+')
        console.log(`📲 Pair this number by entering the code in WhatsApp: ${code}`);
      } catch (err) {
        console.error("❌ Failed to generate pairing code:", err);
      }
    }

    if (connection === "open") {
      console.log("✅ NoxOra connected successfully!");
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
      await sock.sendMessage(msg.key.remoteJid, { text: "🏓 Pong! NoxOra is alive." });
    }
  });
}

startBot();
