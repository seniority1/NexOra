import { isAdmin } from "../utils/isAdmin.js";

export default {
  name: "link",
  description: "Get the group invite link (Admin only)",
  async execute(sock, msg) {
    const groupId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Must be used in a group
    if (!groupId.endsWith("@g.us")) {
      await sock.sendMessage(groupId, { text: "⚠️ This command only works in groups." }, { quoted: msg });
      return;
    }

    // ✅ Check admin privilege
    const admin = await isAdmin(sock, groupId, sender);
    if (!admin) {
      await sock.sendMessage(groupId, { text: "❌ Only *group admins* can use this command." }, { quoted: msg });
      return;
    }

    try {
      const inviteCode = await sock.groupInviteCode(groupId);
      const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
      await sock.sendMessage(groupId, { text: `🔗 *Group Link:*\n${inviteLink}` }, { quoted: msg });
    } catch (err) {
      console.error("❌ link error:", err);
      await sock.sendMessage(groupId, { text: "❌ Failed to get group invite link." }, { quoted: msg });
    }
  },
};
