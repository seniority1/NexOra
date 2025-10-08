import { isOwner } from "../utils/isOwner.js";
import { exec } from "child_process";

export default {
  name: "restart",
  description: "Restart the bot (Owner only)",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const botName = "NexOra";
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Owner check
    if (!isOwner(sender)) {
      return sock.sendMessage(from, { text: "❌ Only owner can use this command!" }, { quoted: msg });
    }

    // ✅ Confirm message
    await sock.sendMessage(
      from,
      {
        text: `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
🔁 Restarting the bot... Please wait a few seconds.
┗━━━━━━━━━━━━━━━━━━━━┛
      `.trim(),
      },
      { quoted: msg }
    );

    // ✅ Restart logic
    try {
      // This assumes your bot is started using a process manager (like pm2 or systemctl)
      // or that your host restarts it automatically after exit
      setTimeout(() => {
        exec("pm2 restart all || npm restart || node index.js");
        process.exit(0);
      }, 2000);
    } catch (err) {
      console.error("Restart error:", err);
      await sock.sendMessage(from, { text: "⚠️ Failed to restart the bot." }, { quoted: msg });
    }
  },
};
