import { isAdmin } from "../utils/isAdmin.js";

export default {
  name: "hidetag",
  description: "Send a hidden tag message to all group members (Admin only)",
  async execute(sock, msg, args) {
    const groupId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Must be used in a group
    if (!groupId.endsWith("@g.us")) {
      await sock.sendMessage(groupId, { text: "⚠️ This command only works in groups." }, { quoted: msg });
      return;
    }

    // ✅ Check if user is admin
    const admin = await isAdmin(sock, groupId, sender);
    if (!admin) {
      await sock.sendMessage(groupId, { text: "❌ Only *group admins* can use this command." }, { quoted: msg });
      return;
    }

    // 📝 Get the message to send
    const messageText = args.length > 0 ? args.join(" ") : "";

    // 📝 Or get the quoted message (if replying)
    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (!messageText && !quotedMsg) {
      await sock.sendMessage(groupId, { text: "⚠️ Usage:\n`.hidetag <text>`\nOr reply to a message with `.hidetag`" }, { quoted: msg });
      return;
    }

    try {
      const metadata = await sock.groupMetadata(groupId);
      const participants = metadata.participants;
      const mentions = participants.map(p => p.id);

      if (quotedMsg) {
        // Forward the quoted message with hidden mentions
        await sock.sendMessage(
          groupId,
          {
            forward: quotedMsg,
            mentions
          },
          { quoted: msg }
        );
      } else {
        // Send a new message with hidden mentions
        await sock.sendMessage(
          groupId,
          {
            text: messageText,
            mentions
          },
          { quoted: msg }
        );
      }

    } catch (err) {
      console.error("❌ Hidetag command error:", err);
      await sock.sendMessage(groupId, { text: "❌ Failed to send hidetag message." }, { quoted: msg });
    }
  },
};
