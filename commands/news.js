export default {
  name: "news",
  description: "Get the latest news headlines",
  async execute(sock, msg) {
    const botName = "NexOra";

    // 📰 Fallback local headlines (in case API fails)
    const localHeadlines = [
      "🚀 SpaceX launches new satellite constellation for global internet.",
      "💉 Scientists make breakthrough in universal flu vaccine research.",
      "🌍 UN warns of record-breaking climate extremes in 2025.",
      "📱 Major tech company unveils next-generation AI chip.",
      "⚽ Historic upset in the World Cup qualifiers shocks fans worldwide."
    ];

    let headlines = [];

    try {
      // 🌐 Fetch latest news (using GNews public API)
      // Note: You can replace `topic=breaking-news` or specify language like `lang=en`
      const res = await fetch("https://gnews.io/api/v4/top-headlines?lang=en&max=3&topic=breaking-news&apikey=1f6b2e86d28c07cf4d4f67c0b4e2d00e");
      const data = await res.json();

      if (data && data.articles && data.articles.length > 0) {
        headlines = data.articles.slice(0, 3).map((article, index) => {
          return `*${index + 1}.* ${article.title}\n🔗 ${article.url}`;
        });
      } else {
        // ❌ If API returns nothing → fallback
        headlines = localHeadlines.slice(0, 3).map((h, i) => `*${i + 1}.* ${h}`);
      }
    } catch (err) {
      // 🚨 If API fails → fallback
      headlines = localHeadlines.slice(0, 3).map((h, i) => `*${i + 1}.* ${h}`);
    }

    const newsText = `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
           📰 *LATEST NEWS* 📰

${headlines.join("\n\n")}

┗━━━━━━━━━━━━━━━━━━━━┛
    `;

    await sock.sendMessage(
      msg.key.remoteJid,
      { text: newsText.trim() },
      { quoted: msg }
    );
  },
};
