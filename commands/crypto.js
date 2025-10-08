export default {
  name: "crypto",
  description: "Get the latest cryptocurrency price",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const botName = "NexOra";
    const coin = args[0]?.toLowerCase();

    if (!coin) {
      return sock.sendMessage(from, { text: "📈 Usage: `.crypto <coin>`\nExample: `.crypto bitcoin`" }, { quoted: msg });
    }

    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coin)}&vs_currencies=usd`);
      const data = await res.json();

      if (!data[coin] || !data[coin].usd) {
        return sock.sendMessage(from, { text: `❌ Could not find price for *${coin}*.` }, { quoted: msg });
      }

      const price = data[coin].usd.toLocaleString();

      const reply = `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
          📈 *CRYPTO PRICE* 📈

🪙 *Coin:* ${coin.charAt(0).toUpperCase() + coin.slice(1)}  
💵 *USD Price:* $${price}

🔹 Data from CoinGecko API
┗━━━━━━━━━━━━━━━━━━━━┛
      `;

      await sock.sendMessage(from, { text: reply.trim() }, { quoted: msg });
    } catch (err) {
      await sock.sendMessage(from, { text: "⚠️ Failed to fetch crypto price." }, { quoted: msg });
    }
  },
};
