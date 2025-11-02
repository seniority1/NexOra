// commands/imagecvt.js
import fs from "fs";
import axios from "axios";
import FormData from "form-data";

export default {
  name: "imagecvt",
  description: "Extract text from an image (auto language detection)",

  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imageUrl = args[0];

    try {
      let resultText = "";

      // ✅ If user replied to an image
      if (quoted && quoted.imageMessage) {
        const buffer = await sock.downloadMediaMessage({ message: quoted });

        const form = new FormData();
        form.append("apikey", "helloworld"); // Free demo key
        form.append("language", "eng"); // Auto-detection mode covers most major languages
        form.append("isOverlayRequired", "false");
        form.append("OCREngine", "2"); // Advanced recognition engine
        form.append("file", buffer, { filename: "image.jpg" });

        const { data } = await axios.post("https://api.ocr.space/parse/image", form, {
          headers: form.getHeaders(),
        });

        resultText = data?.ParsedResults?.[0]?.ParsedText?.trim() || "No text found.";
      }

      // ✅ If user sent an image URL
      else if (imageUrl && imageUrl.startsWith("http")) {
        const api = `https://api.ocr.space/parse/imageurl?apikey=helloworld&OCREngine=2&url=${encodeURIComponent(
          imageUrl
        )}`;
        const { data } = await axios.get(api);
        resultText = data?.ParsedResults?.[0]?.ParsedText?.trim() || "No text found.";
      }

      // ❌ If neither image nor URL
      else {
        await sock.sendMessage(
          from,
          {
            text: `📸 Please reply to an image or provide an image URL.\n\nExample:\n.imagecvt https://example.com/text-image.jpg`,
          },
          { quoted: msg }
        );
        return;
      }

      // 🧾 Send result
      await sock.sendMessage(
        from,
        { text: `🧠 *Extracted Text:*\n\n${resultText}` },
        { quoted: msg }
      );
    } catch (err) {
      console.error("⚠️ OCR error:", err);
      await sock.sendMessage(from, { text: "❌ Failed to extract text from image." }, { quoted: msg });
    }
  },
};
