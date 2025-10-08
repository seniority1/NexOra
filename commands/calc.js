export default {
  name: "calc",
  description: "Calculate a mathematical expression",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const botName = "NexOra";
    const expr = args.join(" ");

    if (!expr) {
      return sock.sendMessage(from, { text: "🧮 Usage: `.calc 5+5*2`" }, { quoted: msg });
    }

    try {
      const result = Function(`"use strict"; return (${expr})`)();

      const reply = `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
        🧮 *CALCULATOR* 🧮

📥 *Expression:* ${expr}  
📤 *Result:* ${result}

┗━━━━━━━━━━━━━━━━━━━━┛
      `;
      await sock.sendMessage(from, { text: reply.trim() }, { quoted: msg });
    } catch (err) {
      await sock.sendMessage(from, { text: "❌ Invalid expression." }, { quoted: msg });
    }
  },
};
