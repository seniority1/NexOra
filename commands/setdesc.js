import { isAdmin } from "../utils/isAdmin.js";

export default {
  name: "setdesc",
  description: "Change the group description (Admin only)",
  async execute(sock, msg, args) {
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

    // 📝 Get new description
    const newDesc = args.join(" ");
    if (!newDesc) {
      await sock.sendMessage(groupId, { text: "⚠️ Usage: `.setdesc This is our new group description`" }, { quoted: msg });
      return;
    }

    try {
      await sock.groupUpdateDescription(groupId, newDesc);
      await sock.sendMessage(groupId, { text: `✅ Group description updated:\n\n${newDesc}` }, { quoted: msg });
    } catch (err) {
      console.error("❌ setdesc error:", err);
      await sock.sendMessage(groupId, { text: "❌ Failed to change the group description." }, { quoted: msg });
    }
  },
};
