// commands/rps.js
export default {
  name: "rps",
  description: "Play Rock-Paper-Scissors with the bot",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const userChoice = args[0]?.toLowerCase();

    if (!userChoice || !["rock", "paper", "scissors"].includes(userChoice)) {
      await sock.sendMessage(
        from,
        {
          text: "✊ *Rock-Paper-Scissors Game*\n\nUsage: `.rps <rock/paper/scissors>`\nExample: `.rps rock`",
        },
        { quoted: msg }
      );
      return;
    }

    const choices = ["rock", "paper", "scissors"];
    const botChoice = choices[Math.floor(Math.random() * choices.length)];

    let result;
    if (userChoice === botChoice) result = "🤝 It's a *draw!*";
    else if (
      (userChoice === "rock" && botChoice === "scissors") ||
      (userChoice === "paper" && botChoice === "rock") ||
      (userChoice === "scissors" && botChoice === "paper")
    )
      result = "🎉 You *win!*";
    else result = "😢 You *lose!*";

    const msgText = `🎮 *Rock-Paper-Scissors* 🎮\n\n👤 You: *${userChoice}*\n🤖 Bot: *${botChoice}*\n\n${result}`;

    await sock.sendMessage(from, { text: msgText }, { quoted: msg });
  },
};
