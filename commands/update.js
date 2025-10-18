import { isOwner } from "../utils/isOwner.js";
import { exec } from "child_process";

export default {
  name: "update",
  description: "Update bot from GitHub (Owner only)",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const botName = "NexOra";
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Owner check
    if (!isOwner(sender)) {
      return sock.sendMessage(from, { text: "❌ Only owner can use this command!" }, { quoted: msg });
    }

    await sock.sendMessage(
      from,
      {
        text: `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
🔄 *Updating bot from GitHub...*
Please wait...
┗━━━━━━━━━━━━━━━━━━━━┛
        `.trim(),
      },
      { quoted: msg }
    );

    // ✅ Run git pull to fetch updates
    exec("git pull", (error, stdout, stderr) => {
      if (error) {
        console.error("Update error:", error);
        return sock.sendMessage(from, { text: `❌ Update failed:\n\`\`\`${stderr || error.message}\`\`\`` }, { quoted: msg });
      }

      sock.sendMessage(
        from,
        {
          text: `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
✅ *Update Completed!*
\`\`\`${stdout}\`\`\`
Bot will now restart to apply changes...
┗━━━━━━━━━━━━━━━━━━━━┛
          `.trim(),
        },
        { quoted: msg }
      );

      // ✅ Restart the process after pulling
      exec("pm2 restart all || npm run restart || node index.js", (restartErr) => {
        if (restartErr) {
          console.error("Restart error:", restartErr);
          sock.sendMessage(from, { text: "⚠️ Updated but failed to restart automatically. Please restart manually." }, { quoted: msg });
        }
      });
    });
  },
};
