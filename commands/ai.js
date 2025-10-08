export default {
  name: "ai",
  description: "Chat with NexOra's AI assistant",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const botName = "NexOra";
    const prompt = args.join(" ");

    if (!prompt) {
      return sock.sendMessage(from, { text: "🤖 Usage: `.ai <your question>`" }, { quoted: msg });
    }

    try {
      // ⚡ Using a free fallback API (DuckDuckGo AI Search)
      const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(prompt)}&format=json&no_redirect=1`);
      const data = await res.json();

      let answer =
        data.AbstractText ||
        data.Answer ||
        "I couldn’t find a perfect answer, but I'm still learning! 🤖✨";

      const reply = `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
            🧠 *AI ASSISTANT* 🧠

💬 *Prompt:* ${prompt}

📝 *Response:*  
${answer}

┗━━━━━━━━━━━━━━━━━━━━┛
      `;

      await sock.sendMessage(from, { text: reply.trim() }, { quoted: msg });
    } catch (err) {
      await sock.sendMessage(from, { text: "⚠️ AI request failed." }, { quoted: msg });
    }
  },
};
