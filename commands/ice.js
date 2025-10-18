import { textpro } from "../utils/textpro.js";

export default {
  name: "ice",
  description: "❄️ Create ice-cold style text",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: "❄️ Usage: .ice <text>" }, { quoted: msg });

    try {
      const imgUrl = await textpro("https://textpro.me/ice-cold-text-effect-862.html", text);
      await sock.sendMessage(from, { image: { url: imgUrl }, caption: `❄️ Ice text created for: *${text}*` }, { quoted: msg });
    } catch (err) {
      console.error("❌ Ice command error:", err);
      await sock.sendMessage(from, { text: "⚠️ Failed to create ice logo." }, { quoted: msg });
    }
  },
};
