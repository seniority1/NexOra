import { isAdmin } from "../utils/isAdmin.js";

export default {
  name: "setname",
  description: "Change the group subject (Admin only)",
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

    // 📝 Get new group name
    const newName = args.join(" ");
    if (!newName) {
      await sock.sendMessage(groupId, { text: "⚠️ Usage: `.setname New Group Name`" }, { quoted: msg });
      return;
    }

    try {
      await sock.groupUpdateSubject(groupId, newName);
      await sock.sendMessage(groupId, { text: `✅ Group name changed to *${newName}*` }, { quoted: msg });
    } catch (err) {
      console.error("❌ setname error:", err);
      await sock.sendMessage(groupId, { text: "❌ Failed to change the group name." }, { quoted: msg });
    }
  },
};
