// commands/ocr.js
import { createWorker } from "tesseract.js";

export default {
  name: "ocr",
  description: "Extract text from an image (Optical Character Recognition)",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (!quoted || !quoted.imageMessage) {
      await sock.sendMessage(
        from,
        { text: "🖼️ *Reply to an image* with *.ocr* to extract text from it." },
        { quoted: msg }
      );
      return;
    }

    try {
      await sock.sendMessage(from, { text: "🔍 Extracting text, please wait..." }, { quoted: msg });

      const buffer = await sock.downloadMediaMessage({ message: quoted });

      // Create OCR worker (English by default)
      const worker = await createWorker("eng");

      const {
        data: { text },
      } = await worker.recognize(buffer);

      await worker.terminate();

      const cleanText = text.trim() || "⚠️ No readable text found in the image.";

      await sock.sendMessage(
        from,
        {
          text: `📜 *Extracted Text:*\n\n${cleanText}`,
        },
        { quoted: msg }
      );
    } catch (err) {
      console.error("❌ OCR Error:", err);
      await sock.sendMessage(
        from,
        { text: "❌ Failed to extract text from the image. Try again later." },
        { quoted: msg }
      );
    }
  },
};
