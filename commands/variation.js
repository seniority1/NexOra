import { downloadMediaMessage } from "@whiskeysockets/baileys";
import fetch from "node-fetch";
import fs from "fs";

export default {
  name: "variation",
  description: "Generate a variation of a replied image using AI",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;

    // ✅ Must reply to an image
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted || !quoted.imageMessage) {
      await sock.sendMessage(from, { text: "⚠️ Reply to an *image* to create a variation." }, { quoted: msg });
      return;
    }

    await sock.sendMessage(from, { text: "🎨 Creating image variation... please wait ⏳" }, { quoted: msg });

    try {
      // 🖼️ Download the replied image
      const mediaMsg = { message: quoted };
      const buffer = await downloadMediaMessage(mediaMsg, "buffer", {}, { reuploadRequest: sock });
      const tempFile = `./temp_variation_${Date.now()}.png`;
      fs.writeFileSync(tempFile, buffer);

      const apiKey = process.env.OPENAI_API_KEY || "your_openai_api_key_here";

      // 📡 Send image to OpenAI for variation
      const response = await fetch("https://api.openai.com/v1/images/variations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: (() => {
          const form = new FormData();
          form.append("model", "gpt-image-1");
          form.append("image", fs.createReadStream(tempFile));
          form.append("size", "1024x1024");
          return form;
        })(),
      });

      const data = await response.json();
      fs.unlinkSync(tempFile);

      if (data.data && data.data[0].url) {
        const imageUrl = data.data[0].url;
        await sock.sendMessage(from, {
          image: { url: imageUrl },
          caption: "✨ Here's your AI-generated variation!",
        }, { quoted: msg });
      } else {
        throw new Error("No variation image returned from API");
      }

    } catch (err) {
      console.error("❌ Variation command error:", err);
      await sock.sendMessage(from, { text: "⚠️ Failed to create variation. Please try again later." }, { quoted: msg });
    }
  },
};
