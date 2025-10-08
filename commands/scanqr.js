import { Jimp } from "jimp"; // ✅ correct for Node.js v22 (ESM)
import jsQR from "jsqr";
import { downloadMediaMessage } from "@whiskeysockets/baileys";

export default {
  name: "scanqr",
  description: "🔍 Scan a QR code from an image and return its content",
  async execute(sock, msg) {
    const botName = "NexOra";

    // 📎 Check if message has image or quoted image
    const message = msg.message?.imageMessage
      ? msg
      : msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage
      ? {
          message: {
            imageMessage:
              msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage,
          },
          key: msg.key,
        }
      : null;

    if (!message) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "📸 *Send or reply to an image containing a QR code* to scan it.",
      }, { quoted: msg });
      return;
    }

    try {
      // 🧠 Download image buffer using the helper function
      const buffer = await downloadMediaMessage(message, "buffer", {});

      // 🧩 Read the image with Jimp
      const image = await Jimp.read(buffer);
      const { width, height, data } = image.bitmap;
      const imageData = new Uint8ClampedArray(data);

      // 🕵️ Decode the QR code
      const code = jsQR(imageData, width, height);

      if (code) {
        const qrText = code.data;
        const resultText = `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
📌 *QR CODE SCANNED* 📌

${qrText}

┗━━━━━━━━━━━━━━━━━━━━┛
        `;

        await sock.sendMessage(msg.key.remoteJid, { text: resultText.trim() }, { quoted: msg });
      } else {
        await sock.sendMessage(msg.key.remoteJid, {
          text: "❌ *No QR code found in the image.*\nMake sure it's clear and not blurry.",
        }, { quoted: msg });
      }
    } catch (error) {
      console.error("❌ Error scanning QR:", error);
      await sock.sendMessage(msg.key.remoteJid, {
        text: "⚠️ An error occurred while scanning the QR code.",
      }, { quoted: msg });
    }
  },
};
