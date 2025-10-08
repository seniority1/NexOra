import jsQR from "jsqr";

export default {
  name: "scanqr",
  description: "Scan a QR code from an image",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const botName = "NexOra";

    if (!msg.message.imageMessage) {
      return sock.sendMessage(from, { text: "📷 Reply to an *image containing a QR code* with `.scanqr`" }, { quoted: msg });
    }

    try {
      const buffer = await sock.downloadMediaMessage(msg);
      const image = await import("jimp").then(m => m.default.read(buffer));
      const qr = jsQR(
        new Uint8ClampedArray(image.bitmap.data),
        image.bitmap.width,
        image.bitmap.height
      );

      if (!qr) {
        return sock.sendMessage(from, { text: "⚠️ No QR code found in this image." }, { quoted: msg });
      }

      const reply = `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
         📷 *QR SCANNER* 📷

✅ *Decoded Text:*  
${qr.data}

┗━━━━━━━━━━━━━━━━━━━━┛
      `;

      await sock.sendMessage(from, { text: reply.trim() }, { quoted: msg });
    } catch (err) {
      await sock.sendMessage(from, { text: "⚠️ Failed to scan QR code." }, { quoted: msg });
    }
  },
};
