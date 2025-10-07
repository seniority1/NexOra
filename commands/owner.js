export default {
  name: "owner",
  description: "Show the bot owner's name and contact",
  async execute(sock, msg) {
    const botName = "NexOra";          // 🤖 Bot name
    const ownerName = "Seniority";    // 👑 Owner name
    const ownerNumber = "2349160291884";  // 🌐 Owner number with country code (no @s.whatsapp.net)
    const waLink = `https://wa.me/${ownerNumber}`;

    const ownerText = `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
        👑 *${botName.toUpperCase()} OWNER* 👑

🧑‍💻 *Name:* ${ownerName}  
📱 *Contact:* [Tap to chat](${waLink})

┗━━━━━━━━━━━━━━━━━━━━┛
    `;

    await sock.sendMessage(
      msg.key.remoteJid,
      {
        text: ownerText.trim(),
        linkPreview: {
          renderLargerThumbnail: false,
        },
      },
      { quoted: msg } // ✅ replies to the user's message
    );
  },
};
