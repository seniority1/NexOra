// commands/getppbot.js
export default {
  name: "getppbot",
  description: "Get the bot’s profile picture",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;

    try {
      const botJid = sock.user.id;
      const ppUrl = await sock.profilePictureUrl(botJid, "image");
      await sock.sendMessage(from, { image: { url: ppUrl }, caption: "🤖 Bot’s profile picture" }, { quoted: msg });
    } catch {
      await sock.sendMessage(from, { text: "❌ Couldn't fetch the bot's profile picture." }, { quoted: msg });
    }
  },
};
