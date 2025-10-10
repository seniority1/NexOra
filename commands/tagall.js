import { isAdmin } from "../utils/isAdmin.js";

export default {
  name: "tagall",
  description: "Tag all members in the group (Admin only)",
  async execute(sock, msg, args) {
    const groupId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Make sure it's used in a group
    if (!groupId.endsWith("@g.us")) {
      await sock.sendMessage(groupId, { text: "⚠️ This command only works in groups." }, { quoted: msg });
      return;
    }

    // ✅ Check if the sender is a group admin
    const admin = await isAdmin(sock, groupId, sender);
    if (!admin) {
      await sock.sendMessage(groupId, { text: "❌ Only *group admins* can use this command." }, { quoted: msg });
      return;
    }

    try {
      // 📝 Fetch group metadata
      const metadata = await sock.groupMetadata(groupId);
      const participants = metadata.participants;

      // 📄 Optional message after the command
      const messageText = args.length > 0 ? args.join(" ") : "📢 *Attention everyone!*";

      // 📌 Create mentions list
      const mentions = participants.map((p) => p.id);
      const tagText = participants.map((p) => `@${p.id.split("@")[0]}`).join(" ");

      const finalText = `${messageText}\n\n${tagText}`;

      await sock.sendMessage(
        groupId,
        {
          text: finalText,
          mentions: mentions,
        },
        { quoted: msg }
      );
    } catch (err) {
      console.error("❌ Tagall command error:", err);
      await sock.sendMessage(groupId, { text: "❌ Failed to tag everyone." }, { quoted: msg });
    }
  },
};
