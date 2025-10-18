import { textpro } from "../utils/textpro.js";

export default {
  name: "joker",
  description: "🃏 Create Joker-style text logo",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: "🃏 Usage: .joker <text>" }, { quoted: msg });

    try {
      const imgUrl = await textpro("https://textpro.me/create-logo-joker-online-934.html", text);
      await sock.sendMessage(from, { image: { url: imgUrl }, caption: `🃏 Joker text created for: *${text}*` }, { quoted: msg });
    } catch (err) {
      console.error("❌ Joker command error:", err);
      await sock.sendMessage(from, { text: "⚠️ Failed to create joker logo." }, { quoted: msg });
    }
  },
};
