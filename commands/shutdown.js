import { isOwner } from "../utils/isOwner.js";

export default {
  name: "shutdown",
  description: "Shutdown the bot (Owner only)",
  async execute(sock, msg) {
    const sender = msg.key.participant || msg.key.remoteJid;

    if (!isOwner(sender)) {
      await sock.sendMessage(msg.key.remoteJid, { text: "❌ Only owner can use this!" }, { quoted: msg });
      return;
    }

    await sock.sendMessage(msg.key.remoteJid, { text: "✅ Shutting down..." }, { quoted: msg });
    process.exit(0);
  },
};
