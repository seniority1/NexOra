import { isAdmin } from "../utils/isAdmin.js";

export default {
  name: "revoke",
  description: "Revoke (reset) the group invite link (Admin only)",
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
      await sock.groupRevokeInvite(groupId);
      await sock.sendMessage(groupId, { text: "✅ Group invite link has been *revoked* and a new one generated." }, { quoted: msg });
    } catch (err) {
      console.error("❌ revoke error:", err);
      await sock.sendMessage(groupId, { text: "❌ Failed to revoke group invite link." }, { quoted: msg });
    }
  },
};
