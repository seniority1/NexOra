export default {
  name: "quote",
  description: "Send a random motivational or tech quote",
  async execute(sock, msg) {
    const botName = "NexOra";

    // 📚 Local fallback quotes
    const localQuotes = [
      { text: "Code is like humor. When you have to explain it, it’s bad.", author: "Cory House" },
      { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
      { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
      { text: "The best way to predict the future is to invent it.", author: "Alan Kay" },
      { text: "Simplicity is the soul of efficiency.", author: "Austin Freeman" },
      { text: "Programs must be written for people to read, and only incidentally for machines to execute.", author: "Harold Abelson" },
      { text: "Don’t comment bad code—rewrite it.", author: "Brian Kernighan" },
    ];

    let quoteTextData;

    try {
      // 🌐 Fetch random quote from API
      const res = await fetch("https://api.quotable.io/random");
      const data = await res.json();

      if (data && data.content) {
        quoteTextData = { text: data.content, author: data.author || "Unknown" };
      } else {
        // ❌ If API returns invalid data, use fallback
        quoteTextData = localQuotes[Math.floor(Math.random() * localQuotes.length)];
      }
    } catch (err) {
      // 🚨 If fetch fails, fallback to local quotes
      quoteTextData = localQuotes[Math.floor(Math.random() * localQuotes.length)];
    }

    // 📝 Format final message
    const quoteText = `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
         ✨ *RANDOM QUOTE* ✨

💬 “${quoteTextData.text}”
— *${quoteTextData.author}*

┗━━━━━━━━━━━━━━━━━━━━┛
    `;

    await sock.sendMessage(
      msg.key.remoteJid,
      { text: quoteText.trim() },
      { quoted: msg }
    );
  },
};
