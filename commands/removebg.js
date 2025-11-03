import axios from "axios";
import fs from "fs";
import FormData from "form-data";

const REMOVE_BG_API_KEY = "NNJJBLFUro2fHyUiWsDsGZWo"; // 🔑 Replace this!

export default {
  name: "removebg",
  description: "Remove background from an image",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imageMsg = quoted?.imageMessage;

    if (!imageMsg) {
      await sock.sendMessage(from, { text: "❌ Reply to an image to remove its background." }, { quoted: msg });
      return;
    }

    const buffer = await sock.downloadMediaMessage({ message: quoted });
    const form = new FormData();
    form.append("image_file", buffer, "image.jpg");

    try {
      const res = await axios.post("https://api.remove.bg/v1.0/removebg", form, {
        headers: {
          ...form.getHeaders(),
          "X-Api-Key": NNJJBLFUro2fHyUiWsDsGZWo,
        },
        responseType: "arraybuffer",
      });

      const outputPath = "./temp_no_bg.png";
      fs.writeFileSync(outputPath, res.data);

      await sock.sendMessage(from, {
        image: { url: outputPath },
        caption: "✅ Background removed successfully!",
      }, { quoted: msg });

      fs.unlinkSync(outputPath);
    } catch (err) {
      console.error(err.response?.data || err.message);
      await sock.sendMessage(from, {
        text: "⚠️ Failed to remove background. Make sure your API key is valid or try again later.",
      }, { quoted: msg });
    }
  },
};
