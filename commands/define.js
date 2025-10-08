export default {
  name: "define",
  description: "Get the definition of a word",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const botName = "NexOra";
    const word = args.join(" ");

    if (!word) {
      return sock.sendMessage(from, { text: "✏️ Usage: `.define <word>`" }, { quoted: msg });
    }

    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      const data = await res.json();

      if (!Array.isArray(data)) {
        return sock.sendMessage(from, { text: `❌ No definition found for *${word}*.` }, { quoted: msg });
      }

      const meaning = data[0].meanings[0];
      const def = meaning.definitions[0].definition;

      const text = `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
          📚 *DICTIONARY* 📚

🔸 *Word:* ${word}  
📖 *Definition:* ${def}

┗━━━━━━━━━━━━━━━━━━━━┛
      `;

      await sock.sendMessage(from, { text: text.trim() }, { quoted: msg });
    } catch (err) {
      await sock.sendMessage(from, { text: "⚠️ Error fetching definition." }, { quoted: msg });
    }
  },
};
