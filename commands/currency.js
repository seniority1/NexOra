export default {
  name: "currency",
  description: "Convert currency values",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const botName = "NexOra";
    const [amountStr, fromCurrency, toCurrency] = args;

    if (!amountStr || !fromCurrency || !toCurrency) {
      return sock.sendMessage(from, { text: "💱 Usage: `.currency <amount> <from> <to>`\nExample: `.currency 100 USD EUR`" }, { quoted: msg });
    }

    const amount = parseFloat(amountStr);
    if (isNaN(amount)) {
      return sock.sendMessage(from, { text: "❌ Invalid amount." }, { quoted: msg });
    }

    try {
      const res = await fetch(`https://api.exchangerate.host/convert?from=${fromCurrency.toUpperCase()}&to=${toCurrency.toUpperCase()}&amount=${amount}`);
      const data = await res.json();

      if (!data.result) {
        return sock.sendMessage(from, { text: "⚠️ Conversion failed." }, { quoted: msg });
      }

      const reply = `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
        💱 *CURRENCY CONVERTER* 💱

💰 *Amount:* ${amount} ${fromCurrency.toUpperCase()}  
➡️ *Converted:* ${data.result.toFixed(2)} ${toCurrency.toUpperCase()}

📊 Rate: 1 ${fromCurrency.toUpperCase()} = ${(data.result / amount).toFixed(4)} ${toCurrency.toUpperCase()}

┗━━━━━━━━━━━━━━━━━━━━┛
      `;

      await sock.sendMessage(from, { text: reply.trim() }, { quoted: msg });
    } catch (err) {
      await sock.sendMessage(from, { text: "⚠️ Currency conversion error." }, { quoted: msg });
    }
  },
};
