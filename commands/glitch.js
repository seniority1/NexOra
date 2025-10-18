import { textpro } from "../utils/textpro.js";

export default {
  name: "glitch",
  description: "⚡ Create a glitch-style logo",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: "⚡ Usage: .glitch <text>" }, { quoted: msg });

    try {
      const imgUrl = await textpro("https://textpro.me/create-glitch-text-effect-style-tik-tok-983.html", text);
      await sock.sendMessage(from, { image: { url: imgUrl }, caption: `⚡ Glitch text created for: *${text}*` }, { quoted: msg });
    } catch (err) {
      console.error("❌ Glitch command error:", err);
      await sock.sendMessage(from, { text: "⚠️ Failed to create glitch logo." }, { quoted: msg });
    }
  },
};
