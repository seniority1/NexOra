import { isAdmin } from "../utils/isAdmin.js";
import { downloadMediaMessage } from "@whiskeysockets/baileys";

export default {
  name: "setppgc",
  description: "Set group profile picture (Admin only)",
  async execute(sock, msg) {
    const groupId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Check group
    if (!groupId.endsWith("@g.us")) {
      await sock.sendMessage(groupId, { text: "⚠️ This command only works in groups." }, { quoted: msg });
      return;
    }

    // ✅ Check admin
    const admin = await isAdmin(sock, groupId, sender);
    if (!admin) {
      await sock.sendMessage(groupId, { text: "❌ Only *group admins* can use this command." }, { quoted: msg });
      return;
    }

    // ✅ Check if replied to an image
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted || (!quoted.imageMessage && !quoted.videoMessage)) {
      await sock.sendMessage(groupId, { text: "⚠️ Reply to an *image* to set it as group profile picture." }, { quoted: msg });
      return;
    }

    try {
      // 🧠 Download image buffer
      const mediaMsg = { message: quoted };
      const buffer = await downloadMediaMessage(mediaMsg, "buffer", {}, { reuploadRequest: sock });

      // 🖼️ Set group profile pic
      await sock.updateProfilePicture(groupId, buffer);

      await sock.sendMessage(groupId, { text: "✅ Group profile picture *updated successfully!* 🖼️" }, { quoted: msg });
    } catch (err) {
      console.error("❌ setppgc error:", err);
      await sock.sendMessage(groupId, { text: "❌ Failed to set group profile picture." }, { quoted: msg });
    }
  },
};
