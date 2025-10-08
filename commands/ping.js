export default {
  name: "ping",
  description: "Test the bot's response speed and uptime",
  async execute(sock, msg) {
    const botName = "NexOra";

    const start = Date.now();
    // Send a temporary message (optional, you can skip this if you prefer one reply)
    const sentMsg = await sock.sendMessage(msg.key.remoteJid, { text: "🏓 *Pinging...*" }, { quoted: msg });

    const ping = Date.now() - start;
    const uptime = formatUptime(process.uptime() * 1000);

    const pingText = `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
          🏓 *PING RESULT* 🏓

⚡ *Response Speed:* ${ping} ms  
🕒 *Uptime:* ${uptime}  
✅ *Status:* Online and running smoothly

┗━━━━━━━━━━━━━━━━━━━━┛
    `;

    // Edit the temporary message with the result (or just send a new one)
    await sock.sendMessage(
      msg.key.remoteJid,
      { text: pingText.trim() },
      { quoted: msg }
    );
  },
};

// Helper to format uptime like "1h 23m 45s"
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
