export default {
  name: "ai",
  description: "Chat with NexOra's AI assistant (DuckDuckGo + Wikipedia fallback)",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const botName = "NexOra";
    const prompt = args.join(" ");

    if (!prompt) {
      return sock.sendMessage(from, { text: "🤖 Usage: `.ai <your question>`" }, { quoted: msg });
    }

    try {
      // 🦆 1) Try DuckDuckGo Instant Answer API
      const duckRes = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(prompt)}&format=json&no_redirect=1`);
      const duckData = await duckRes.json();

      let answer =
        duckData.AbstractText ||
        duckData.Answer ||
        "";

      // 📚 2) If DuckDuckGo gave nothing → try Wikipedia summary API
      if (!answer) {
        const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(prompt)}`);
        if (wikiRes.ok) {
          const wikiData = await wikiRes.json();
          if (wikiData.extract) {
            answer = wikiData.extract;
          }
        }
      }

      // 😅 3) If both fail → default fallback message
      if (!answer) {
        answer = "I couldn’t find a perfect answer, but I'm still learning! 🤖✨";
      }

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
      console.error("❌ AI command error:", err);
      await sock.sendMessage(from, { text: "⚠️ AI request failed. Please try again later." }, { quoted: msg });
    }
  },
};
