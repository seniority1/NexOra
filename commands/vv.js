import { downloadMediaMessage } from "@whiskeysockets/baileys";

export default {
  name: "vv",
  description: "Reveal view-once image/video or resend voice note",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (!quoted) {
      return sock.sendMessage(from, {
        text: "⚠️ Reply to a *view-once image*, *video*, or *voice note* with `.vv`.",
      }, { quoted: msg });
    }

    try {
      // --- viewOnceMessageV2 (newer shape) ---
      if (quoted.viewOnceMessageV2?.message?.imageMessage) {
        const buffer = await downloadMediaMessage({ message: quoted.viewOnceMessageV2 }, "buffer", {});
        return await sock.sendMessage(from, { image: buffer, caption: "👁️‍🗨️ View-once image revealed" }, { quoted: msg });
      }
      if (quoted.viewOnceMessageV2?.message?.videoMessage) {
        const buffer = await downloadMediaMessage({ message: quoted.viewOnceMessageV2 }, "buffer", {});
        return await sock.sendMessage(from, { video: buffer, caption: "👁️‍🗨️ View-once video revealed" }, { quoted: msg });
      }

      // --- viewOnceMessage older shape ---
      if (quoted.viewOnceMessage?.message?.imageMessage) {
        const buffer = await downloadMediaMessage({ message: quoted.viewOnceMessage }, "buffer", {});
        return await sock.sendMessage(from, { image: buffer, caption: "👁️‍🗨️ View-once image revealed" }, { quoted: msg });
      }
      if (quoted.viewOnceMessage?.message?.videoMessage) {
        const buffer = await downloadMediaMessage({ message: quoted.viewOnceMessage }, "buffer", {});
        return await sock.sendMessage(from, { video: buffer, caption: "👁️‍🗨️ View-once video revealed" }, { quoted: msg });
      }

      // --- direct image/video with viewOnce flag ---
      if (quoted.imageMessage?.viewOnce || quoted.imageMessage) {
        // if it's a normal image (not view-once) this will also work
        const buffer = await downloadMediaMessage({ message: { imageMessage: quoted.imageMessage } }, "buffer", {});
        return await sock.sendMessage(from, { image: buffer, caption: "👁️‍🗨️ Image revealed" }, { quoted: msg });
      }
      if (quoted.videoMessage?.viewOnce || quoted.videoMessage) {
        const buffer = await downloadMediaMessage({ message: { videoMessage: quoted.videoMessage } }, "buffer", {});
        return await sock.sendMessage(from, { video: buffer, caption: "👁️‍🗨️ Video revealed" }, { quoted: msg });
      }

      // --- audio / voice note (normal audio) ---
      if (quoted.audioMessage) {
        const buffer = await downloadMediaMessage({ message: { audioMessage: quoted.audioMessage } }, "buffer", {});
        const mimetype = quoted.audioMessage.mimetype || "audio/ogg; codecs=opus";
        const isPtt = !!quoted.audioMessage.ptt;
        return await sock.sendMessage(from, {
          audio: buffer,
          mimetype,
          ptt: isPtt,
        }, { quoted: msg });
      }

      // --- nothing matched ---
      return await sock.sendMessage(from, { text: "⚠️ That message doesn't contain view-once media or audio." }, { quoted: msg });

    } catch (err) {
      console.error("❌ VV command error:", err);
      await sock.sendMessage(from, { text: "❌ Failed to reveal the media. The message might be corrupted or blocked by WhatsApp." }, { quoted: msg });
    }
  },
};
