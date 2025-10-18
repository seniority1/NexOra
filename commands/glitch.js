export default {
  name: "glitch",
  description: "Generate glitch styled text logo 🪩",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: "⚡ Usage: `.glitch NexOra`" }, { quoted: msg });

    const api = `https://api.xteam.xyz/textpro/glitch?text=${encodeURIComponent(text)}&apikey=YOUR_API_KEY`;
    
    await sock.sendMessage(from, {
      image: { url: api },
      caption: `⚡ *Glitch Effect for:* ${text}`,
    }, { quoted: msg });
  },
};
