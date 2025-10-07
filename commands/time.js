export default {
  name: "time",
  description: "Show the current date and time",
  async execute(sock, msg) {
    // 🕒 Get current date/time
    const now = new Date();

    // Format time nicely (24-hour format)
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const seconds = now.getSeconds().toString().padStart(2, "0");

    const day = now.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const timeText = `
┏━━🕒 *CURRENT TIME* 🕒━━┓

📅 *Date:* ${day}  
⏰ *Time:* ${hours}:${minutes}:${seconds}

🌍 Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}

┗━━━━━━━━━━━━━━━━━━━━┛
    `;

    // 📤 Send time info
    await sock.sendMessage(msg.key.remoteJid, { text: timeText.trim() });
  },
};
