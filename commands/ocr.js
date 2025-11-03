// commands/ocr.js
import { createWorker } from "tesseract.js";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

      // ✅ Download image from quoted message
      const stream = await downloadContentFromMessage(quoted.imageMessage, "image");
      let buffer = Buffer.from([]);
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

      // 🖼️ Save temp file
      const tempPath = path.join(__dirname, `ocr_${Date.now()}.jpg`);
      fs.writeFileSync(tempPath, buffer);

      // 🧠 Run OCR
      const worker = await createWorker("eng");
      const {
        data: { text },
      } = await worker.recognize(tempPath);
      await worker.terminate();

      fs.unlinkSync(tempPath); // cleanup temp file

      const cleanText = text.trim() || "⚠️ No readable text found in the image.";
      await sock.sendMessage(
        from,
        { text: `📜 *Extracted Text:*\n\n${cleanText}` },
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
