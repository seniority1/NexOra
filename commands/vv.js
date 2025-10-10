export default {
  name: "vv",
  description: "Reveal view-once image/video or resend voice note",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;

    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) {
      return sock.sendMessage(from, { text: "⚠️ Reply to a *view-once image*, *video*, or *voice note* with `.vv`." }, { quoted: msg });
    }

    try {
      // 🖼 View-once Image
      if (quoted.imageMessage?.viewOnce) {
        const buffer = await sock.downloadMediaMessage({ message: { imageMessage: quoted.imageMessage } });
        return sock.sendMessage(from, { image: buffer }, { quoted: msg });
      }

      // 🎥 View-once Video
      if (quoted.videoMessage?.viewOnce) {
        const buffer = await sock.downloadMediaMessage({ message: { videoMessage: quoted.videoMessage } });
        return sock.sendMessage(from, { video: buffer }, { quoted: msg });
      }

      // 🎙 Voice note or audio (normal, not view-once)
      if (quoted.audioMessage) {
        const buffer = await sock.downloadMediaMessage({ message: { audioMessage: quoted.audioMessage } });
        return sock.sendMessage(
          from,
          {
            audio: buffer,
            mimetype: quoted.audioMessage.mimetype || "audio/ogg; codecs=opus",
            ptt: quoted.audioMessage.ptt || false,
          },
          { quoted: msg }
        );
      }

      // ❌ If none matched
      return sock.sendMessage(from, { text: "⚠️ That’s not a view-once image/video or audio message." }, { quoted: msg });

    } catch (err) {
      console.error("❌ VV command error:", err);
      await sock.sendMessage(from, { text: "❌ Failed to reveal the media." }, { quoted: msg });
    }
  },
};
