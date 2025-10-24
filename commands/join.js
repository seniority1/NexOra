import { isOwner } from "../utils/isOwner.js";

export default {
  name: "join",
  description: "Join group via invite link (Owner only)",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const botName = "NexOra";
    const link = args[0];

    if (!isOwner(sender))
      return sock.sendMessage(from, { text: "❌ Only owner can use this command!" }, { quoted: msg });

    if (!link)
      return sock.sendMessage(from, { text: "🔗 *Usage:* .join <group link>" }, { quoted: msg });

    const match = link.match(/chat\.whatsapp\.com\/([0-9A-Za-z]+)/);
    if (!match) return sock.sendMessage(from, { text: "❌ Invalid group link." }, { quoted: msg });

    try {
      const inviteCode = match[1];
      await sock.groupAcceptInvite(inviteCode);
      await sock.sendMessage(from, { text: "✅ Joined the group successfully!" }, { quoted: msg });
    } catch {
      await sock.sendMessage(from, { text: "⚠️ Failed to join group." }, { quoted: msg });
    }
  },
};
