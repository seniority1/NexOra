import { textpro } from "../utils/textpro.js";

export default {
  name: "fancy",
  description: "✨ Create stylish fancy text",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: "✨ Usage: .fancy <text>" }, { quoted: msg });

    try {
      const imgUrl = await textpro("https://textpro.me/create-glossy-metallic-text-effect-online-372.html", text);
      await sock.sendMessage(from, { image: { url: imgUrl }, caption: `✨ Fancy text created for: *${text}*` }, { quoted: msg });
    } catch (err) {
      console.error("❌ Fancy command error:", err);
      await sock.sendMessage(from, { text: "⚠️ Failed to create fancy text." }, { quoted: msg });
    }
  },
};
