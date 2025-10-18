export default {
  name: "ice",
  description: "❄️ Generate a frozen icy text logo",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: "💡 Usage: `.ice <text>`" }, { quoted: msg });

    try {
      const apiUrl = `https://api.lolhuman.xyz/api/photooxy1?apikey=BetaBotz&theme=ice-cold&text=${encodeURIComponent(text)}`;
      await sock.sendMessage(from, {
        image: { url: apiUrl },
        caption: `❄️ *Ice Logo Created!*\n\n📝 Text: ${text}`,
      }, { quoted: msg });
    } catch (err) {
      console.error("❌ Ice logo error:", err);
      await sock.sendMessage(from, { text: "⚠️ Failed to create ice logo." }, { quoted: msg });
    }
  },
};
