import { textpro } from "../utils/textpro.js";

export default {
  name: "fire",
  description: "🔥 Generate fire-style text logo",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const text = args.join(" ");
    if (!text)
      return sock.sendMessage(from, { text: "🔥 Usage: .fire <text>" }, { quoted: msg });

    try {
      const imgUrl = await textpro(
        "https://textpro.me/create-a-fire-text-effect-logo-online-free-393.html",
        text
      );

      await sock.sendMessage(
        from,
        {
          image: { url: imgUrl },
          caption: `🔥 Fire text created for: *${text}*`,
        },
        { quoted: msg }
      );
    } catch (err) {
      console.error("❌ Fire command error:", err);
      await sock.sendMessage(
        from,
        { text: "⚠️ Failed to create fire logo." },
        { quoted: msg }
      );
    }
  },
};
