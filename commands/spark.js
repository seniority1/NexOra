export default {
  name: "spark",
  description: "✨ Generate a sparkling metallic text logo",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: "💡 Usage: `.spark <text>`" }, { quoted: msg });

    try {
      const apiUrl = `https://api.lolhuman.xyz/api/photooxy1?apikey=BetaBotz&theme=sparkling-metallic&text=${encodeURIComponent(text)}`;
      await sock.sendMessage(from, {
        image: { url: apiUrl },
        caption: `✨ *Spark Logo Created!*\n\n📝 Text: ${text}`,
      }, { quoted: msg });
    } catch (err) {
      console.error("❌ Spark logo error:", err);
      await sock.sendMessage(from, { text: "⚠️ Failed to create spark logo." }, { quoted: msg });
    }
  },
};
