export default {
  name: "joker",
  description: "🃏 Generate a Joker-style logo",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: "💡 Usage: `.joker <text>`" }, { quoted: msg });

    try {
      const apiUrl = `https://api.lolhuman.xyz/api/photooxy1?apikey=BetaBotz&theme=joker-logo&text=${encodeURIComponent(text)}`;
      await sock.sendMessage(from, {
        image: { url: apiUrl },
        caption: `🃏 *Joker Logo Created!*\n\n📝 Text: ${text}`,
      }, { quoted: msg });
    } catch (err) {
      console.error("❌ Joker logo error:", err);
      await sock.sendMessage(from, { text: "⚠️ Failed to create joker logo." }, { quoted: msg });
    }
  },
};
