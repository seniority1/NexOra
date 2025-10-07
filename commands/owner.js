export default {
  name: "owner",
  description: "Show the bot owner's name and contact",
  async execute(sock, msg) {
    const ownerName = "Noxora Dev";              // 👤 Your display name
    const ownerNumber = "2349160291884";            // 🌐 Your number with country code (no @s.whatsapp.net)
    const waLink = `https://wa.me/${ownerNumber}`;

    const ownerText = `
┏━━👑 *BOT OWNER* 👑━━┓

🧑‍💻 *Name:* ${ownerName}  
📱 *Contact:* [Click here to chat](${waLink})

┗━━━━━━━━━━━━━━━━━━━━┛
    `;

    await sock.sendMessage(msg.key.remoteJid, {
      text: ownerText.trim(),
      linkPreview: { // 👈 makes the WhatsApp link clickable with a preview
        renderLargerThumbnail: false,
      },
    });
  },
};
