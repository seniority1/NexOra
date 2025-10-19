import { getOwners } from "../utils/isOwner.js";

export default {
  name: "listowners",
  description: "List all saved bot owners",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const owners = getOwners();
    const text = owners.length
      ? "👑 *Bot Owners:*\n" + owners.map(o => `• ${o}`).join("\n")
      : "❌ No owners saved.";
    await sock.sendMessage(from, { text });
  },
};
