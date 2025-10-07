const {
  default: makeWASocket,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const readline = require("readline");

// ✅ Simple function to ask for user input in the console
function ask(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth");

  const sock = makeWASocket({
    logger: pino({ level: "silent" }),
    printQRInTerminal: false, // ❌ no QR, we'll use pairing code
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
    },
    browser: ["Ubuntu", "Chrome", "22.04.4"], // makes WhatsApp see it as desktop
  });

  // 🧠 First time setup → Ask for number & generate pairing code
  if (!state.creds.registered) {
    try {
      const phoneNumber = await ask("📲 Enter your WhatsApp number (with country code, no +): ");
      const code = await sock.requestPairingCode(phoneNumber);
      console.log(`\n✅ Pairing code generated: ${code}`);
      console.log("👉 Go to WhatsApp > Linked Devices > Link with phone number and enter this code.\n");
    } catch (err) {
      console.error("⚠️ Error generating pairing code:", err);
    }
  }

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      console.log("❌ Connection closed. Reason:", reason);
      if (reason !== DisconnectReason.loggedOut) {
        startBot();
      }
    } else if (connection === "open") {
      console.log("✅ Bot connected successfully!");
    }
  });

  // 📩 Simple .menu command for testing
  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];
    if (!msg.message) return;
    const from = msg.key.remoteJid;
    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    if (text === ".menu") {
      await sock.sendMessage(from, {
        text: `
┏━🔥 *BOT MENU* 🔥━┓
┣ .menu   → Show menu
┣ .help   → Show help
┣ .about  → About bot
┗━━━━━━━━━━━━━━━┛
        `,
      });
    }
  });
}

startBot();
