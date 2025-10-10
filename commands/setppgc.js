import { isAdmin } from "../utils/isAdmin.js";
import { downloadMediaMessage } from "@whiskeysockets/baileys";

export default {
  name: "setppgc",
  description: "Change the group profile picture (Admin only)",
  async execute(sock, msg) {
    const groupId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Must be used in a group
    if (!groupId.endsWith("@g.us")) {
      await sock.sendMessage(groupId, { text: "⚠️ This command only works in groups." }, { quoted: msg });
      return;
    }

    // ✅ Check if sender is admin
    const admin = await isAdmin(sock, groupId, sender);
    if (!admin) {
      await sock.sendMessage(groupId, { text: "❌ Only *group admins* can use this command." }, { quoted: msg });
      return;
    }

    // 🖼️ Check for image (either sent or replied)
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imageMessage = msg.message?.imageMessage || quoted?.imageMessage;

    if (!imageMessage) {
      await sock.sendMessage(groupId, { text: "⚠️ Please send or reply to an *image* with `.setppgc`" }, { quoted: msg });
      return;
    }

    try {
      // 📥 Download the image buffer
      const mediaBuffer = await downloadMediaMessage(
        { message: imageMessage },
        "buffer",
        {},
        { logger: console }
      );

      // 🖼️ Update group profile picture
      await sock.updateProfilePicture(groupId, mediaBuffer);
      await sock.sendMessage(groupId, { text: "✅ Group profile picture updated successfully!" }, { quoted: msg });
    } catch (err) {
      console.error("❌ setppgc error:", err);
      await sock.sendMessage(groupId, { text: "❌ Failed to update group profile picture." }, { quoted: msg });
    }
  },
};
