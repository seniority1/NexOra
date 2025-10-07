export default {
  name: "menu",
  async execute(sock, msg) {
    const menu = `
┏━━🔥 *NOXORA MENU* 🔥━━┓
┣ .ping   → Test bot speed
┣ .menu   → Show this menu
┣ .about  → Info about bot
┗━━━━━━━━━━━━━━━━━━━━┛
    `;
    await sock.sendMessage(msg.key.remoteJid, { text: menu });
  },
};
