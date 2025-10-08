export default {
  name: "shorten",
  description: "Shorten a URL",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const botName = "NexOra";
    const url = args[0];

    if (!url) {
      return sock.sendMessage(from, { text: "🔗 Usage: `.shorten <url>`" }, { quoted: msg });
    }

    try {
      const res = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
      const shortUrl = await res.text();

      const text = `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
      🔗 *URL SHORTENER* 🔗

🌐 *Original:* ${url}  
✂️ *Shortened:* ${shortUrl}

┗━━━━━━━━━━━━━━━━━━━━┛
      `;
      await sock.sendMessage(from, { text: text.trim() }, { quoted: msg });
    } catch (err) {
      await sock.sendMessage(from, { text: "⚠️ Failed to shorten URL." }, { quoted: msg });
    }
  },
};
