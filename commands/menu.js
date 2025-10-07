import fs from "fs";

export default {
  name: "menu",
  async execute(sock, msg) {
    const jid = msg.key.remoteJid;

    // Local image path (you can change this to your own logo)
    const imagePath = "./media/noxora.jpg"; // ✅ make sure this file exists

    // If file doesn't exist, fallback message
    if (!fs.existsSync(imagePath)) {
      await sock.sendMessage(jid, {
        text: "⚠️ Menu image not found. Please add 'noxora.jpg' in the /media folder.",
      });
      return;
    }

    const caption = `
╭━━━🔥 *NOXORA MENU* 🔥━━━╮
┃  .ping   → Test bot speed
┃  .menu   → Show this menu
┃  .about  → About the bot
┃  .ai <text> → Chat with AI (coming soon 🤖)
╰━━━━━━━━━━━━━━━━━━━━━━╯

💡 *Powered by Baileys & NoxOra Core*
`;

    await sock.sendMessage(jid, {
      image: { url: imagePath },
      caption,
    });
  },
};
