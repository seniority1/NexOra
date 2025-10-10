import { isAdmin } from "../utils/isAdmin.js";

export default {
  name: "kick",
  description: "Kick a user from the group (Admin only)",
  async execute(sock, msg, args) {
    const groupId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    // 🛑 Check if it's a group
    if (!groupId.endsWith("@g.us")) {
      await sock.sendMessage(groupId, { text: "⚠️ This command can only be used in groups." }, { quoted: msg });
      return;
    }

    // 🛑 Check if sender is an admin
    const admin = await isAdmin(sock, groupId, sender);
    if (!admin) {
      await sock.sendMessage(groupId, { text: "❌ Only *group admins* can use this command." }, { quoted: msg });
      return;
    }

    // 🧍 Get target user
    let target;
    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
      target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (args[0]) {
      target = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net";
    }

    if (!target) {
      await sock.sendMessage(groupId, { text: "⚠️ Mention a user or provide their number.\n\nExample:\n.kick @user\n.kick 2348012345678" }, { quoted: msg });
      return;
    }

    try {
      await sock.groupParticipantsUpdate(groupId, [target], "remove");
      await sock.sendMessage(groupId, { text: `✅ Removed @${target.split("@")[0]}`, mentions: [target] }, { quoted: msg });
    } catch (err) {
      console.error("❌ Kick command error:", err);
      await sock.sendMessage(groupId, { text: "❌ Failed to kick the user." }, { quoted: msg });
    }
  },
};
