export default {
  name: "graffiti",
  description: "Make graffiti style logo text 🧱",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const text = args.join(" ");
    if (!text) return sock.sendMessage(from, { text: "🎨 Usage: `.graffiti NoxOra`" }, { quoted: msg });

    const api = `https://api.neoxr.eu/api/textpro/graffiti?text=${encodeURIComponent(text)}&apikey=free`;
    
    await sock.sendMessage(from, {
      image: { url: api },
      caption: `🎨 *Graffiti Text:*\n${text}`,
    }, { quoted: msg });
  },
};
