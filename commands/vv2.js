import { downloadMediaMessage } from "@whiskeysockets/baileys";

export default {
  name: "vv2",
  description: "Silently download view-once image/video/voice to your DM",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const userJid = msg.key.participant || msg.key.remoteJid;
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (!quoted) {
      return sock.sendMessage(from, {
        text: "⚠️ Reply to a *view-once image*, *video*, or *voice note* with `.vv2`.",
      }, { quoted: msg });
    }

    try {
      // --- viewOnceMessageV2 ---
      if (quoted.viewOnceMessageV2?.message?.imageMessage) {
        const buffer = await downloadMediaMessage({ message: quoted.viewOnceMessageV2 }, "buffer", {});
        await sock.sendMessage(userJid, { image: buffer, caption: "👁️‍🗨️ Saved view-once image" });
        return;
      }
      if (quoted.viewOnceMessageV2?.message?.videoMessage) {
        const buffer = await downloadMediaMessage({ message: quoted.viewOnceMessageV2 }, "buffer", {});
        await sock.sendMessage(userJid, { video: buffer, caption: "👁️‍🗨️ Saved view-once video" });
        return;
      }

      // --- viewOnceMessage (old shape) ---
      if (quoted.viewOnceMessage?.message?.imageMessage) {
        const buffer = await downloadMediaMessage({ message: quoted.viewOnceMessage }, "buffer", {});
        await sock.sendMessage(userJid, { image: buffer, caption: "👁️‍🗨️ Saved view-once image" });
        return;
      }
      if (quoted.viewOnceMessage?.message?.videoMessage) {
        const buffer = await downloadMediaMessage({ message: quoted.viewOnceMessage }, "buffer", {});
        await sock.sendMessage(userJid, { video: buffer, caption: "👁️‍🗨️ Saved view-once video" });
        return;
      }

      // --- direct image/video ---
      if (quoted.imageMessage?.viewOnce || quoted.imageMessage) {
        const buffer = await downloadMediaMessage({ message: { imageMessage: quoted.imageMessage } }, "buffer", {});
        await sock.sendMessage(userJid, { image: buffer, caption: "👁️‍🗨️ Saved image" });
        return;
      }
      if (quoted.videoMessage?.viewOnce || quoted.videoMessage) {
        const buffer = await downloadMediaMessage({ message: { videoMessage: quoted.videoMessage } }, "buffer", {});
        await sock.sendMessage(userJid, { video: buffer, caption: "👁️‍🗨️ Saved video" });
        return;
      }

      // --- audio ---
      if (quoted.audioMessage) {
        const buffer = await downloadMediaMessage({ message: { audioMessage: quoted.audioMessage } }, "buffer", {});
        const mimetype = quoted.audioMessage.mimetype || "audio/ogg; codecs=opus";
        const isPtt = !!quoted.audioMessage.ptt;
        await sock.sendMessage(userJid, {
          audio: buffer,
          mimetype,
          ptt: isPtt,
        });
        return;
      }

      await sock.sendMessage(from, { text: "⚠️ That message doesn't contain view-once media or audio." }, { quoted: msg });

    } catch (err) {
      console.error("❌ VV2 command error:", err);
      await sock.sendMessage(from, { text: "❌ Failed to save media to DM." }, { quoted: msg });
    }
  },
};
