import { isOwner } from "../utils/isOwner.js";
import { getMode, setMode } from "../utils/mode.js";

export default {
  name: "mode",
  description: "Switch between public and private bot mode (Owner only)",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const botName = "NexOra";
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Owner check
    if (!isOwner(sender)) {
      return sock.sendMessage(from, { text: "❌ Only owner can use this command!" }, { quoted: msg });
    }

    const option = args[0]?.toLowerCase();
    const currentMode = getMode();

    if (!option || (option !== "public" && option !== "private")) {
      return sock.sendMessage(
        from,
        {
          text: `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
🌐 *Current Mode:* ${currentMode.toUpperCase()}

📘 Usage:
• *.mode public*  → Everyone can use the bot
• *.mode private* → Only owner can use the bot
┗━━━━━━━━━━━━━━━━━━━━┛
          `.trim(),
        },
        { quoted: msg }
      );
    }

    // ✅ Switch mode
    setMode(option);

    await sock.sendMessage(
      from,
      {
        text: `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
✅ Bot mode switched to *${option.toUpperCase()}*
┗━━━━━━━━━━━━━━━━━━━━┛
        `.trim(),
      },
      { quoted: msg }
    );
  },
};
