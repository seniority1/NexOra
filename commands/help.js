export default {
  name: "help",
  description: "Show basic bot usage instructions",
  async execute(sock, msg) {
    const botName = "NexOra";

    const helpText = `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
         💡 *HELP MENU* 💡

🤖 *${botName} Help Guide*  

This bot helps manage groups and make chats more fun.  
Here’s how to use it:

🔹 Start every command with a dot (.)  
🔹 Example:  
  • .menu → shows all commands  
  • .hidetag Hello → tags everyone secretly  
  • .setrules Be respectful → set group rules

💡 *Tip:* Use *.menu* to see the full list of commands.
┗━━━━━━━━━━━━━━━━━━━━┛
    `;

    await sock.sendMessage(
      msg.key.remoteJid,
      {
        text: helpText.trim(),
        linkPreview: { renderLargerThumbnail: false },
      },
      { quoted: msg } // ✅ reply to user's message
    );
  },
};
