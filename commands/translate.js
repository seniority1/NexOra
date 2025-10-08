export default {
  name: "translate",
  description: "Translate text to a target language",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const botName = "NexOra";
    const [lang, ...textParts] = args;
    const text = textParts.join(" ");

    if (!lang || !text) {
      return sock.sendMessage(from, { text: "🌐 Usage: `.translate <lang_code> <text>`" }, { quoted: msg });
    }

    try {
      const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`);
      const data = await res.json();
      const translated = data[0].map(item => item[0]).join("");

      const replyText = `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
         🌐 *TRANSLATOR* 🌐

📝 *Original:* ${text}  
🌍 *Language:* ${lang}  
✅ *Translated:* ${translated}

┗━━━━━━━━━━━━━━━━━━━━┛
      `;
      await sock.sendMessage(from, { text: replyText.trim() }, { quoted: msg });
    } catch (err) {
      await sock.sendMessage(from, { text: "⚠️ Translation failed." }, { quoted: msg });
    }
  },
};
