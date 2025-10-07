export default {
  name: "help",
  description: "Show basic bot usage instructions",
  async execute(sock, msg) {
    const helpText = `
┏━━💡 *NOXORA HELP* 💡━━┓

🤖 *Bot Help Guide*  

This bot helps manage groups and make chats fun.  
Here’s how to use it:

🔹 Start with a dot (.) before every command.  
🔹 Example:  
  • .menu → shows all commands  
  • .hidetag Hello → tags everyone secretly  
  • .setrules Be respectful → set group rules  

💡 Tip: Use .menu to see the full list of commands.

┗━━━━━━━━━━━━━━━━━━━━┛
    `;

    await sock.sendMessage(msg.key.remoteJid, { text: helpText.trim() });
  },
};
