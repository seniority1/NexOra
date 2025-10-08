import QRCode from "qrcode";

export default {
  name: "qrcode",
  description: "Generate a QR code from text or URL",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const botName = "NexOra";
    const text = args.join(" ");

    if (!text) {
      return sock.sendMessage(from, { text: "📸 Usage: `.qrcode <text or url>`" }, { quoted: msg });
    }

    try {
      const qrBuffer = await QRCode.toBuffer(text);

      await sock.sendMessage(from, {
        image: qrBuffer,
        caption: `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
         📸 *QR CODE* 📸

✅ QR code generated successfully  
🔹 *Data:* ${text}

┗━━━━━━━━━━━━━━━━━━━━┛
        `.trim(),
      }, { quoted: msg });
    } catch (err) {
      await sock.sendMessage(from, { text: "⚠️ Failed to generate QR code." }, { quoted: msg });
    }
  },
};
