// bot.js
import makeWASocket, {
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  DisconnectReason,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";
import pino from "pino";

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

  // 📲 Pairing code (non-interactive)
  if (!state.creds.registered) {
    const phoneNumber = process.env.WHATSAPP_NUMBER || "2349160291884";
    console.log(`⏳ Requesting pairing code for ${phoneNumber}...`);
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(phoneNumber.trim());
        console.log(`✅ Pairing code: ${code}`);
        console.log("➡️ Go to WhatsApp → Linked Devices → Link with phone number");
      } catch (err) {
        console.error("⚠️ Pairing code error:", err.message);
      }
    }, 3000);
  }

  // 🌐 Connection handling (note: async so we can await sendMessage)
  sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log("✅ NoxOra connected!");

      // Notify owner (configurable)
      const notifyNumber = process.env.NOTIFY_NUMBER || process.env.WHATSAPP_NUMBER || "2349160291884";
      const jid = `${notifyNumber}@s.whatsapp.net`;

      try {
        // safe notify — wrapped in try/catch so failure doesn't crash bot
        await sock.sendMessage(jid, {
          text: "🤖 *NoxOra is back online!* Running smoothly ✅"
        });
        console.log(`ℹ️ Sent "back online" message to ${jid}`);
      } catch (err) {
        console.warn("⚠️ Could not send online notification:", err.message || err);
      }

    } else if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      console.log("❌ Connection closed:", reason);
      if (reason !== DisconnectReason.loggedOut) {
        console.log("♻️ Reconnecting NoxOra...");
        startBot();
      } else {
        console.log("🪪 Logged out. Delete auth folder to relink.");
      }
    }
  });

  // 💓 Heartbeat — check every 2 minutes
  setInterval(async () => {
    try {
      if (sock?.user) {
        console.log("💓 Heartbeat OK — Connected as:", sock.user.id);
      } else {
        console.log("💔 Disconnected — Restarting bot...");
        startBot();
      }
    } catch (err) {
      console.error("⚠️ Heartbeat error:", err.message);
      startBot();
    }
  }, 120000); // 2 minutes

  // 💬 Basic command
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;
    const from = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

    if (text === ".ping") {
      await sock.sendMessage(from, { text: "🏓 Pong! NoxOra is alive ⚡" });
    }
  });
}

startBot();
