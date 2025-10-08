import { isOwner } from "../utils/isOwner.js";

export default {
  name: "block",
  description: "Block a user (Owner only)",
  async execute(sock, msg) {
    const sender = msg.key.participant || msg.key.remoteJid;

    // Check if the sender is an owner
    if (!isOwner(sender)) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Only owner can use this command!",
      }, { quoted: msg });
      return;
    }

    // Get number to block (either replied message or argument)
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.participant;
    const text = msg.message?.conversation?.split(" ")[1];
    const target = mentioned || (text && text + "@s.whatsapp.net");

    if (!target) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "⚠️ Please mention a user or provide a number to block.\nExample:\n• Reply to their message with `.block`\n• Or use `.block 2349012345678`",
      }, { quoted: msg });
      return;
    }

    try {
      await sock.updateBlockStatus(target, "block");
      await sock.sendMessage(msg.key.remoteJid, {
        text: `✅ Successfully blocked @${target.split("@")[0]}`,
        mentions: [target],
      }, { quoted: msg });
    } catch (err) {
      console.error("Block error:", err);
      await sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Failed to block user. Make sure the number is valid or the bot is not already blocked.",
      }, { quoted: msg });
    }
  },
};
