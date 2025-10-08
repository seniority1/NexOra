export default {
  name: "remind",
  description: "Set a reminder after a specific time",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const botName = "NexOra";
    const [timeStr, ...messageParts] = args;
    const reminderText = messageParts.join(" ");

    if (!timeStr || !reminderText) {
      return sock.sendMessage(from, { text: "⏰ Usage: `.remind <time_in_seconds> <message>`" }, { quoted: msg });
    }

    const timeInMs = parseInt(timeStr) * 1000;
    if (isNaN(timeInMs) || timeInMs <= 0) {
      return sock.sendMessage(from, { text: "⚠️ Invalid time." }, { quoted: msg });
    }

    const confirm = `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
         ⏰ *REMINDER SET* ⏰

📝 *Message:* ${reminderText}  
⏱️ *Time:* ${timeStr} seconds

I’ll remind you soon!
┗━━━━━━━━━━━━━━━━━━━━┛
    `;

    await sock.sendMessage(from, { text: confirm.trim() }, { quoted: msg });

    setTimeout(async () => {
      const reminderMsg = `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
          ⏰ *REMINDER* ⏰

📌 ${reminderText}

⏱️ Set ${timeStr} seconds ago.
┗━━━━━━━━━━━━━━━━━━━━┛
      `;
      await sock.sendMessage(from, { text: reminderMsg.trim() }, { quoted: msg });
    }, timeInMs);
  },
};
