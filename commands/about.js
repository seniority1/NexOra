export default {
  name: "about",
  description: "Show information about the bot",
  async execute(sock, msg) {
    const botName = "NexOra"; // 🤖 Bot name

    const aboutText = `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
        ℹ️ *ABOUT ${botName.toUpperCase()}* ℹ️

${botName} is a smart and powerful WhatsApp bot designed  
to manage groups, automate tasks, and make chats more fun! 🚀

✨ *Features:*  
• Fast & responsive commands ⚡  
• Group management tools 👥  
• Utility, fun & experimental features 🧠  
• Clean terminal-style menu 🧭

👨‍💻 *Developer:* NexOra Dev

┗━━━━━━━━━━━━━━━━━━━━┛
    `;

    await sock.sendMessage(
      msg.key.remoteJid,
      {
        text: aboutText.trim(),
        linkPreview: {
          renderLargerThumbnail: false,
        },
      },
      { quoted: msg } // ✅ reply to user's message
    );
  },
};
