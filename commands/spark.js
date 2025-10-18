import { textpro } from "../utils/textpro.js";

export default {
  name: "spark",
  description: "⚡ Create spark light text logo",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: "⚡ Usage: .spark <text>" }, { quoted: msg });

    try {
      const imgUrl = await textpro("https://textpro.me/sparkling-shiny-metallic-text-effect-online-1001.html", text);
      await sock.sendMessage(from, { image: { url: imgUrl }, caption: `⚡ Spark text created for: *${text}*` }, { quoted: msg });
    } catch (err) {
      console.error("❌ Spark command error:", err);
      await sock.sendMessage(from, { text: "⚠️ Failed to create spark logo." }, { quoted: msg });
    }
  },
};
