import { textpro } from "../utils/textpro.js";

export default {
  name: "neon",
  description: "🌌 Create glowing neon logo",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: "🌌 Usage: .neon <text>" }, { quoted: msg });

    try {
      const imgUrl = await textpro("https://textpro.me/create-a-futuristic-neon-light-text-effect-online-968.html", text);
      await sock.sendMessage(from, { image: { url: imgUrl }, caption: `🌌 Neon text created for: *${text}*` }, { quoted: msg });
    } catch (err) {
      console.error("❌ Neon command error:", err);
      await sock.sendMessage(from, { text: "⚠️ Failed to create neon logo." }, { quoted: msg });
    }
  },
};
