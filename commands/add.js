import { isAdmin } from "../utils/isAdmin.js";

export default {
  name: "add",
  description: "Add a user to the group (Admin only)",
  async execute(sock, msg, args) {
    const groupId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Check if it's a group
    if (!groupId.endsWith("@g.us")) {
      await sock.sendMessage(groupId, { text: "⚠️ This command only works in groups." }, { quoted: msg });
      return;
    }

    // ✅ Check if the sender is an admin
    const admin = await isAdmin(sock, groupId, sender);
    if (!admin) {
      await sock.sendMessage(groupId, { text: "❌ Only *group admins* can use this command." }, { quoted: msg });
      return;
    }

    // 🧍 Get target number
    let number;
    if (args.length > 0) {
      number = args[0].replace(/\D/g, ""); // remove non-digits
    } else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
      number = msg.message.extendedTextMessage.contextInfo.mentionedJid[0].split("@")[0];
    }

    if (!number) {
      await sock.sendMessage(groupId, { text: "⚠️ Usage: `.add 2348012345678` or mention a user." }, { quoted: msg });
      return;
    }

    const userJid = `${number}@s.whatsapp.net`;

    try {
      await sock.groupParticipantsUpdate(groupId, [userJid], "add");
      await sock.sendMessage(groupId, { text: `✅ Added @${number} to the group.`, mentions: [userJid] }, { quoted: msg });
    } catch (err) {
      console.error("❌ Add error:", err);
      await sock.sendMessage(groupId, { text: "❌ Failed to add user. They might need to enable group invites." }, { quoted: msg });
    }
  },
};
