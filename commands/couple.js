export default {
  name: "couple",
  description: "Generate random couple profile pictures",
  async execute(sock, msg) {
    const processingText = `
┏━━💑 *COUPLE PP* ━━┓

💕 Generating cute couple avatars...
⏳ Please wait...

┗━━━━━━━━━━━━━━━━┛
    `.trim();

    await sock.sendMessage(msg.key.remoteJid, { text: processingText }, { quoted: msg });

    try {
      const apiUrl = "https://some-random-api.com/canvas/misc/couplepp";

      const captionText = `
┏━━💑 *YOUR COUPLE PP* ━━┓

❤️ Perfect match! 💕
👩 Female | 👨 Male

Random anime couple avatars

┗━━━━━━━━━━━━━━━━┛
      `.trim();

      await sock.sendMessage(msg.key.remoteJid, {
        image: { url: apiUrl },
        caption: captionText
      }, { quoted: msg });

    } catch (error) {
      await sock.sendMessage(msg.key.remoteJid, { text: "┏━━❌ *ERROR* ━━┓\n\nFailed to generate couple PP!\n┗━━━━━━━━━━━━━━━━┛".trim() }, { quoted: msg });
    }
  },
};
