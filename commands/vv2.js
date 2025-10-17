import fs from "fs";

export default {
  name: "vv2",
  description: "Download a view-once image/video/audio and send it privately",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const userJid = msg.key.participant || msg.key.remoteJid;

    const quoted = msg.message?.extendedTextMessage?.contextInfo;
    if (!quoted || !quoted.stanzaId) {
      return sock.sendMessage(from, { text: "⚠️ Reply to a *view-once* message to use this command." }, { quoted: msg });
    }

    try {
      // Load the original message
      const quotedMsg = await sock.loadMessage(quoted.remoteJid || from, quoted.stanzaId);
      if (!quotedMsg?.message) {
        return sock.sendMessage(from, { text: "❌ Couldn't find the original view-once message." }, { quoted: msg });
      }

      // Identify type of view-once message
      let type;
      let viewOnceObj;

      if (quotedMsg.message.viewOnceMessageV2) {
        const inner = quotedMsg.message.viewOnceMessageV2.message;
        type = Object.keys(inner)[0];
        viewOnceObj = inner[type];
      } else if (quotedMsg.message.viewOnceMessage) {
        const inner = quotedMsg.message.viewOnceMessage.message;
        type = Object.keys(inner)[0];
        viewOnceObj = inner[type];
      } else {
        return sock.sendMessage(from, { text: "⚠️ That message is not a *view-once* type." }, { quoted: msg });
      }

      // Download the media
      const stream = await sock.downloadMediaMessage({ message: { [type]: viewOnceObj } });
      const buffer = Buffer.from(stream);

      // Send it privately to the user
      await sock.sendMessage(userJid, { text: "💾 *Saved view-once media:*" });

      if (type.includes("image")) {
        await sock.sendMessage(userJid, { image: buffer });
      } else if (type.includes("video")) {
        await sock.sendMessage(userJid, { video: buffer });
      } else if (type.includes("audio")) {
        await sock.sendMessage(userJid, { audio: buffer, mimetype: "audio/mpeg", ptt: true });
      } else if (type.includes("document")) {
        await sock.sendMessage(userJid, { document: buffer, fileName: "saved_file" });
      } else {
        await sock.sendMessage(userJid, { text: "⚠️ Unsupported view-once media type." });
      }

      // Optional: silent confirmation in group
      // await sock.sendMessage(from, { text: "✅ Media sent to your DM." }, { quoted: msg });

    } catch (err) {
      console.error("vv2 error:", err);
      await sock.sendMessage(from, { text: "❌ Failed to process view-once message." }, { quoted: msg });
    }
  },
};
