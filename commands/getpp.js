// commands/getpp.js
export default {
  name: "getpp",
  description: "Get a user's profile picture (by reply or mention)",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;

    // ✅ Check if user replied or mentioned someone
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.participant;
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    const target = quoted || mentioned;

    if (!target) {
      await sock.sendMessage(from, { text: "⚠️ Reply to or mention a user to get their profile picture." }, { quoted: msg });
      return;
    }

    try {
      const ppUrl = await sock.profilePictureUrl(target, "image");
      await sock.sendMessage(from, { image: { url: ppUrl }, caption: `🖼️ *Profile Picture of @${target.split("@")[0]}*` }, { quoted: msg, mentions: [target] });
    } catch {
      await sock.sendMessage(from, { text: "❌ No profile picture found for that user." }, { quoted: msg });
    }
  },
};
