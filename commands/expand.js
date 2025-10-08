export default {
  name: "expand",
  description: "Expand a shortened URL",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const botName = "NexOra";
    const url = args[0];

    if (!url) {
      return sock.sendMessage(from, { text: "🌍 Usage: `.expand <short_url>`" }, { quoted: msg });
    }

    try {
      const res = await fetch(url, { method: "HEAD", redirect: "follow" });
      const expanded = res.url;

      const text = `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
        🌍 *URL EXPANDER* 🌍

🔗 *Short URL:* ${url}  
🌐 *Expanded URL:* ${expanded}

┗━━━━━━━━━━━━━━━━━━━━┛
      `;
      await sock.sendMessage(from, { text: text.trim() }, { quoted: msg });
    } catch (err) {
      await sock.sendMessage(from, { text: "⚠️ Failed to expand URL." }, { quoted: msg });
    }
  },
};
