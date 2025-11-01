import { image_gen } from "../utils/imageGen.js";

export default {
  name: "generateimg",
  description: "Generate an AI image from text using AI ✨",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;

    const prompt = args.join(" ");
    if (!prompt) {
      await sock.sendMessage(from, { 
        text: "💡 Example: *.generateimg a futuristic city in space*"
      }, { quoted: msg });
      return;
    }

    try {
      await sock.sendMessage(from, { 
        text: "🎨 Generating your image... please wait..." 
      }, { quoted: msg });

      // 🧠 Generate the image
      const imageUrl = await image_gen(prompt);

      await sock.sendMessage(
        from,
        { image: { url: imageUrl }, caption: `✨ *Prompt:* ${prompt}` },
        { quoted: msg }
      );
    } catch (err) {
      console.error("❌ generateimg error:", err);
      await sock.sendMessage(from, { 
        text: "⚠️ Failed to generate image. Try again later." 
      }, { quoted: msg });
    }
  },
};
