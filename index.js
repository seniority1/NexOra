// index.js - bot-template minimal pairing writer
import fs from "fs";
import path from "path";
import pino from "pino";
import { fileURLToPath } from "url";
import { useMultiFileAuthState, makeCacheableSignalKeyStore, fetchLatestBaileysVersion, makeWASocket } from "@whiskeysockets/baileys";
import config from "./config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const log = pino({ level: "info" });

async function main() {
  // Normalize phone from config
  const phone = (config.phoneNumber || "").toString().trim();
  if (!phone) {
    log.error("No phoneNumber set in config.js. Exiting.");
    process.exit(1);
  }

  // Create auth dir for this bot session
  const authDir = path.join(__dirname, "auth");
  if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }))
    },
    version,
    browser: ["Ubuntu", "Chrome", "22.04"]
  });

  // Persist creds
  sock.ev.on("creds.update", saveCreds);

  // Write pairing code to pairing.txt when Baileys emits it
  sock.ev.on("connection.update", async (update) => {
    try {
      if (update.pairingCode) {
        const code = update.pairingCode;
        log.info(`Pairing code received: ${code}`);
        fs.writeFileSync(path.join(__dirname, "pairing.txt"), code, "utf8");
      }

      const conn = update.connection;
      if (conn === "open") {
        log.info("Connected and ready.");
        // Optionally remove pairing.txt once fully connected:
        const pairingFile = path.join(__dirname, "pairing.txt");
        if (fs.existsSync(pairingFile)) fs.unlinkSync(pairingFile);
      }

      if (conn === "close") {
        log.info("Connection closed, attempting restart...");
        // simple restart policy
        setTimeout(() => process.exit(1), 2000);
      }
    } catch (e) {
      log.error("connection.update error", e?.message || e);
    }
  });

  // Request pairing code if not registered
  if (!state.creds.registered) {
    try {
      log.info(`Requesting pairing code for ${phone}...`);
      const pairing = await sock.requestPairingCode(phone);
      // sock.requestPairingCode also triggers connection.update with pairingCode,
      // but we still write just in case:
      if (pairing) {
        fs.writeFileSync(path.join(__dirname, "pairing.txt"), pairing, "utf8");
        log.info("Pairing code written to pairing.txt");
      }
    } catch (err) {
      log.error("requestPairingCode failed:", err?.message || err);
    }
  } else {
    log.info("This phone is already registered; no pairing required.");
  }

  // Keep process running
  process.stdin.resume();
}

main().catch((err) => {
  console.error("Fatal error in template bot:", err);
  process.exit(1);
});
