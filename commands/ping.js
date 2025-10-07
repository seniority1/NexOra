import os from "os";

export default {
  name: "about",
  description: "Show information about the bot",
  async execute(sock, msg) {
    const botName = "NexOra";       // 🤖 Bot name
    const devName = "NexOra Dev";   // 👨‍💻 Developer
    const botVersion = "1.0.0";     // 🧩 Bot version

    // 🕒 Calculate uptime
    const uptimeMs = process.uptime() * 1000;
    const uptime = formatUptime(uptimeMs);

    // 🖥️ System info
    const platform = `${os.type()} ${os.release()}`;
    const nodeVersion = process.version;

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

📊 *Runtime Info:*  
• 🕒 Uptime: ${uptime}  
• 🧩 Version: ${botVersion}  
• 🖥️ Platform: ${platform}  
• ⚙️ Node.js: ${nodeVersion}

👨‍💻 *Developer:* ${devName}

┗━━━━━━━━━━━━━━━━━━━━┛
    `;

    await sock.sendMessage(
      msg.key.remoteJid,
      {
        text: aboutText.trim(),
        linkPreview: { renderLargerThumbnail: false },
      },
      { quoted: msg } // ✅ reply to user's message
    );
  },
};

// Helper to format uptime nicely (e.g. 1h 23m 45s)
function formatUptime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const h = hours > 0 ? `${hours}h ` : "";
  const m = minutes > 0 ? `${minutes}m ` : "";
  const s = `${seconds}s`;
  return `${h}${m}${s}`;
}
