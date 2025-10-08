export default {
  name: "roll",
  description: "Roll a dice (1-6)",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const botName = "NexOra";
    const number = Math.floor(Math.random() * 6) + 1;

    const reply = `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
            🎲 *DICE ROLL* 🎲

You rolled a *${number}* 🎉
┗━━━━━━━━━━━━━━━━━━━━┛
    `;

    await sock.sendMessage(from, { text: reply.trim() }, { quoted: msg });
  },
};
