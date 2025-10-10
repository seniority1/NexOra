import { isAdmin } from "../utils/isAdmin.js";

export default {
  name: "demote",
  description: "Demote an admin to member (Admin only)",
  async execute(sock, msg, args) {
    const groupId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Check group
    if (!groupId.endsWith("@g.us")) {
      await sock.sendMessage(groupId, { text: "⚠️ This command only works in groups." }, { quoted: msg });
      return;
    }

    // ✅ Check if executor is admin
    const admin = await isAdmin(sock, groupId, sender);
    if (!admin) {
      await sock.sendMessage(groupId, { text: "❌ Only *group admins* can use this command." }, { quoted: msg });
      return;
    }

    // 🧍‍♂️ Get the target user (mention or reply)
    let target;
    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
      target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
      target = msg.message.extendedTextMessage.contextInfo.participant;
    }

    if (!target) {
      await sock.sendMessage(groupId, { text: "⚠️ Mention or reply to the user you want to *demote*." }, { quoted: msg });
      return;
    }

    try {
      await sock.groupParticipantsUpdate(groupId, [target], "demote");
      await sock.sendMessage(groupId, { text: `✅ @${target.split("@")[0]} has been *demoted* to member.`, mentions: [target] }, { quoted: msg });
    } catch (err) {
      console.error("❌ Demote error:", err);
      await sock.sendMessage(groupId, { text: "❌ Failed to demote user." }, { quoted: msg });
    }
  },
};
