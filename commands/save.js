import { downloadMediaMessage } from "@whiskeysockets/baileys";

export default {
  name: "save",
  description: "Save any message/media privately to your DM",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const userJid = msg.key.participant || msg.key.remoteJid;
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (!quoted) {
      return sock.sendMessage(from, {
        text: "💾 Reply to *any message or media* with `.save` to save it privately.",
      }, { quoted: msg });
    }

    try {
      // 📝 Text message
      if (quoted.conversation || quoted.extendedTextMessage?.text) {
        const text = quoted.conversation || quoted.extendedTextMessage?.text;
        await sock.sendMessage(userJid, { text: `💾 *Saved Message:*\n\n${text}` });
        return;
      }

      // 🖼️ Image
      if (quoted.imageMessage) {
        const buffer = await downloadMediaMessage({ message: { imageMessage: quoted.imageMessage } }, "buffer", {});
        await sock.sendMessage(userJid, { image: buffer, caption: "💾 Saved Image" });
        return;
      }

      // 🎥 Video
      if (quoted.videoMessage) {
        const buffer = await downloadMediaMessage({ message: { videoMessage: quoted.videoMessage } }, "buffer", {});
        await sock.sendMessage(userJid, { video: buffer, caption: "💾 Saved Video" });
        return;
      }

      // 🔊 Audio / Voice
      if (quoted.audioMessage) {
        const buffer = await downloadMediaMessage({ message: { audioMessage: quoted.audioMessage } }, "buffer", {});
        const mimetype = quoted.audioMessage.mimetype || "audio/ogg; codecs=opus";
        const isPtt = !!quoted.audioMessage.ptt;
        await sock.sendMessage(userJid, { audio: buffer, mimetype, ptt: isPtt });
        return;
      }

      // 📄 Document
      if (quoted.documentMessage) {
        const buffer = await downloadMediaMessage({ message: { documentMessage: quoted.documentMessage } }, "buffer", {});
        const fileName = quoted.documentMessage.fileName || "saved_file";
        const mimetype = quoted.documentMessage.mimetype || "application/octet-stream";
        await sock.sendMessage(userJid, { document: buffer, fileName, mimetype, caption: "💾 Saved Document" });
        return;
      }

      // 🧠 Sticker
      if (quoted.stickerMessage) {
        const buffer = await downloadMediaMessage({ message: { stickerMessage: quoted.stickerMessage } }, "buffer", {});
        await sock.sendMessage(userJid, { sticker: buffer });
        return;
      }

      // 👁️ View Once Messages
      if (quoted.viewOnceMessageV2 || quoted.viewOnceMessage) {
        const viewOnceMsg = quoted.viewOnceMessageV2 || quoted.viewOnceMessage;
        const inner = viewOnceMsg.message;

        if (inner?.imageMessage) {
          const buffer = await downloadMediaMessage({ message: viewOnceMsg }, "buffer", {});
          await sock.sendMessage(userJid, { image: buffer, caption: "💾 Saved View-Once Image" });
          return;
        }
        if (inner?.videoMessage) {
          const buffer = await downloadMediaMessage({ message: viewOnceMsg }, "buffer", {});
          await sock.sendMessage(userJid, { video: buffer, caption: "💾 Saved View-Once Video" });
          return;
        }
      }

      // 🌀 Nothing matched
      await sock.sendMessage(from, { text: "⚠️ Unsupported message type. Can't save this." }, { quoted: msg });

    } catch (err) {
      console.error("❌ SAVE command error:", err);
      await sock.sendMessage(from, { text: "❌ Failed to save the message." }, { quoted: msg });
    }
  },
};
