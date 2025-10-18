import { isOwner } from "../utils/isOwner.js";
import { downloadMediaMessage } from "@whiskeysockets/baileys";

export default {
  name: "setpropic",
  description: "Change the bot's profile picture (Owner only)",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Owner check
    if (!isOwner(sender)) {
      return sock.sendMessage(from, { text: "❌ Only owner can use this command!" }, { quoted: msg });
    }

    // ✅ Check if replied to an image
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted || !quoted.imageMessage) {
      return sock.sendMessage(
        from,
        { text: "⚠️ Reply to an *image* to set it as the bot's profile picture." },
        { quoted: msg }
      );
    }

    try {
      // 🧠 Download image buffer
      const mediaMsg = { message: quoted };
      const buffer = await downloadMediaMessage(mediaMsg, "buffer", {}, { reuploadRequest: sock });

      // 🖼️ Set bot's own profile pic
      const botJid = sock.user.id;
      await sock.updateProfilePicture(botJid, buffer);

      await sock.sendMessage(
        from,
        { text: "✅ Bot profile picture *updated successfully!* 🖼️" },
        { quoted: msg }
      );
    } catch (err) {
      console.error("❌ setpropic error:", err);
      await sock.sendMessage(from, { text: "❌ Failed to set bot profile picture." }, { quoted: msg });
    }
  },
};
