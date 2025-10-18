export default {
  name: "neon",
  description: "💡 Generate a glowing neon text logo",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: "💡 Usage: `.neon <text>`" }, { quoted: msg });

    try {
      const apiUrl = `https://api.lolhuman.xyz/api/photooxy1?apikey=BetaBotz&theme=neon-light&text=${encodeURIComponent(text)}`;
      await sock.sendMessage(from, {
        image: { url: apiUrl },
        caption: `💡 *Neon Logo Created!*\n\n📝 Text: ${text}`,
      }, { quoted: msg });
    } catch (err) {
      console.error("❌ Neon logo error:", err);
      await sock.sendMessage(from, { text: "⚠️ Failed to create neon logo." }, { quoted: msg });
    }
  },
};
