export default {
  name: "fire",
  description: "🔥 Generate a burning fire text logo",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: "💡 Usage: `.fire <text>`" }, { quoted: msg });

    try {
      const apiUrl = `https://api.lolhuman.xyz/api/photooxy1?apikey=BetaBotz&theme=flaming-text&text=${encodeURIComponent(text)}`;
      await sock.sendMessage(from, {
        image: { url: apiUrl },
        caption: `🔥 *Fire Logo Created!*\n\n📝 Text: ${text}`,
      }, { quoted: msg });
    } catch (err) {
      console.error("❌ Fire logo error:", err);
      await sock.sendMessage(from, { text: "⚠️ Failed to create fire logo." }, { quoted: msg });
    }
  },
};
