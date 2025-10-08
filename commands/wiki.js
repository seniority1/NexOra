export default {
  name: "wiki",
  description: "Search Wikipedia for information",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const botName = "NexOra";
    const query = args.join(" ");

    if (!query) {
      return sock.sendMessage(from, { text: "🌐 Usage: `.wiki <search topic>`" }, { quoted: msg });
    }

    try {
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
      const data = await res.json();

      if (data.type === "https://mediawiki.org/wiki/HyperSwitch/errors/not_found") {
        return sock.sendMessage(from, { text: `❌ No Wikipedia page found for *${query}*.` }, { quoted: msg });
      }

      const title = data.title || query;
      const extract = data.extract || "No summary available.";
      const link = data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`;

      const reply = `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
           🌐 *WIKIPEDIA* 🌐

📌 *Topic:* ${title}

${extract}

🔗 *Read more:* ${link}
┗━━━━━━━━━━━━━━━━━━━━┛
      `;

      await sock.sendMessage(from, { text: reply.trim() }, { quoted: msg });
    } catch (err) {
      await sock.sendMessage(from, { text: "⚠️ Failed to fetch Wikipedia information." }, { quoted: msg });
    }
  },
};
