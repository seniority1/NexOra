// index.js
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
app.get("/", (_, res) => res.send("✅ NoxOra running"));
app.listen(PORT, () => console.log(`🌐 Web server started on port ${PORT}`));

// simple prompt (falls back to env var)
const question = (text) =>
  new Promise((resolve) => {
    if (process.env.WA_PHONE) return resolve(process.env.WA_PHONE);
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

  // stateful flags so we request pairing only once per new session attempt
  let pairingRequested = false;
  let pairingRetries = 0;
  const MAX_PAIRING_RETRIES = 3;

  // listen connection updates and request pairing when appropriate
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "connecting") {
      console.log("🔄 Connecting to WhatsApp...");
      // only request pairing if we don't have a registered session and haven't requested yet
      if (!sock.authState.creds.registered && !pairingRequested) {
        pairingRequested = true; // prevent duplicates
        await requestPairingWithBackoff(sock);
      }
    }

    if (connection === "open") {
      console.log("✅ NoxOra connected successfully!");
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = reason !== DisconnectReason.loggedOut;
      console.log("⚠️ Connection closed. Reconnecting:", shouldReconnect, "reason:", reason);
      if (shouldReconnect) {
        // reset flag so a fresh pairing can be attempted if needed
        pairingRequested = false;
        startBot();
      } else {
        console.log("🧾 Logged out. Remove auth_info to force new pairing.");
      }
    }
  });

  // message handler (example)
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
    if (text.trim().toLowerCase() === ".ping") {
      await sock.sendMessage(msg.key.remoteJid, { text: "🏓 Pong! NoxOra is alive." });
    }
  });

  // helper to request pairing code with retries/backoff
  async function requestPairingWithBackoff(sockInstance) {
    const phoneNumber = (await question("📞 Enter WhatsApp number (e.g., 2348123456789) or set WA_PHONE env var: ")).trim();
    if (!phoneNumber) {
      console.error("❌ No phone number provided. Aborting pairing request.");
      return;
    }

    for (let attempt = 1; attempt <= MAX_PAIRING_RETRIES; attempt++) {
      try {
        console.log(`⏳ Generating pairing code (attempt ${attempt})...`);
        // requestPairingCode may sometimes fail immediately if called too early; try/catch handles it
        const code = await sockInstance.requestPairingCode(phoneNumber);
        console.log(`📲 Pair this device: enter this code in WhatsApp -> ${code}`);
        return;
      } catch (err) {
        console.error(`❌ Pairing attempt ${attempt} failed:`, err?.message || err);
        if (attempt < MAX_PAIRING_RETRIES) {
          const backoffMs = 1000 * attempt * 2; // 2s, 4s, ...
          console.log(`⏳ Waiting ${backoffMs}ms before retrying...`);
          await new Promise((r) => setTimeout(r, backoffMs));
        } else {
          console.error("❌ Max pairing retries reached. Delete auth_info and try again.");
        }
      }
    }
  }
}

startBot();
