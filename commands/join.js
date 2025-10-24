import { isOwner } from "../utils/isOwner.js";

export default {
  name: "join",
  description: "Join a group via invite link or replied link (Owner only)",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const botName = "NexOra";

    // ✅ Owner check
    if (!isOwner(sender)) {
      return sock.sendMessage(
        from,
        { text: "❌ Only the owner can use this command!" },
        { quoted: msg }
      );
    }

    // 🧩 Get link (either from args or reply)
    const quotedText =
      msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation ||
      msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text ||
      "";

    const link = args[0] || quotedText?.trim();

    // ⚙️ Usage guide
    if (!link) {
      return sock.sendMessage(
        from,
        {
          text: `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
🔗 *Join Group Command*

📘 Usage:
• .join https://chat.whatsapp.com/xxxxxxxxxxxxxxxx
• Or reply to a WhatsApp group link message with *.join*
┗━━━━━━━━━━━━━━━━━━━━┛
          `.trim(),
        },
        { quoted: msg }
      );
    }

    // 🔍 Check if it's a valid WhatsApp link
    if (!link.includes("https://chat.whatsapp.com/")) {
      return sock.sendMessage(
        from,
        { text: "❌ That’s not a valid WhatsApp group link." },
        { quoted: msg }
      );
    }

    // 🔎 Extract invite code
    const match = link.match(/chat\.whatsapp\.com\/([0-9A-Za-z]+)/);
    if (!match) {
      return sock.sendMessage(
        from,
        { text: "❌ Invalid group invite link format." },
        { quoted: msg }
      );
    }

    const inviteCode = match[1];

    try {
      const response = await sock.groupAcceptInvite(inviteCode);
      const metadata = await sock.groupMetadata(response);
      await sock.sendMessage(
        from,
        {
          text: `✅ Successfully joined *${metadata.subject}*!\n👥 Members: ${metadata.participants.length}`,
        },
        { quoted: msg }
      );
    } catch (err) {
      console.error("Join error:", err);
      await sock.sendMessage(
        from,
        { text: "⚠️ Failed to join the group. Maybe the link is expired or invalid." },
        { quoted: msg }
      );
    }
  },
};
