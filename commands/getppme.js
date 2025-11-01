// commands/getppme.js
export default {
  name: "getppme",
  description: "Get your own WhatsApp profile picture",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    try {
      const ppUrl = await sock.profilePictureUrl(sender, "image");
      await sock.sendMessage(from, { image: { url: ppUrl }, caption: "🖼️ Your profile picture" }, { quoted: msg });
    } catch {
      await sock.sendMessage(from, { text: "❌ Couldn't fetch your profile picture." }, { quoted: msg });
    }
  },
};
