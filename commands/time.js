export default {
  name: "time",
  description: "Show the current date and time",
  async execute(sock, msg) {
    const botName = "NexOra";

    // 🕒 Get current date/time
    const now = new Date();

    // Format time in 24-hour format
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const seconds = now.getSeconds().toString().padStart(2, "0");

    const formattedDate = now.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const timeText = `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
          🕒 *CURRENT TIME* 🕒

📅 *Date:* ${formattedDate}  
⏰ *Time:* ${hours}:${minutes}:${seconds}  
🌍 *Timezone:* ${timeZone}

┗━━━━━━━━━━━━━━━━━━━━┛
    `;

    await sock.sendMessage(
      msg.key.remoteJid,
      {
        text: timeText.trim(),
        linkPreview: { renderLargerThumbnail: false },
      },
      { quoted: msg } // ✅ reply to user's message
    );
  },
};
