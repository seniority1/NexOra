import { textpro } from "../utils/textpro.js";

export default {
  name: "graffiti",
  description: "🎨 Create graffiti-style logo",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: "🎨 Usage: .graffiti <text>" }, { quoted: msg });

    try {
      const imgUrl = await textpro("https://textpro.me/create-a-cool-graffiti-text-on-the-wall-1010.html", text);
      await sock.sendMessage(from, { image: { url: imgUrl }, caption: `🎨 Graffiti text created for: *${text}*` }, { quoted: msg });
    } catch (err) {
      console.error("❌ Graffiti command error:", err);
      await sock.sendMessage(from, { text: "⚠️ Failed to create graffiti logo." }, { quoted: msg });
    }
  },
};
