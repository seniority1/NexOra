export default {
  name: "love",
  description: "Check love percentage between you and someone",
  async execute(sock, msg, args) {
    const target = args.join(" ");
    if (!target)
      return await sock.sendMessage(msg.key.remoteJid, {
        text: "❤️ *Usage:* .love <name or @user>",
      });

    const love = Math.floor(Math.random() * 100) + 1;
    const emoji = love > 75 ? "💖" : love > 50 ? "💞" : love > 25 ? "💔" : "❌";
    await sock.sendMessage(msg.key.remoteJid, {
      text: `💘 *Love Match*\n❤️ ${target} & You = ${love}% ${emoji}`,
    });
  },
};
