export default {
  name: "textmaker",
  description: "Show text maker commands list",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const reply = `
🎨 *Text Maker Category* 🎨

1️⃣ .fancy <text> → Stylish fonts  
2️⃣ .glitch <text> → Glitch logo  
3️⃣ .graffiti <text> → Graffiti style  

💡 More effects coming soon!
    `;
    await sock.sendMessage(from, { text: reply.trim() }, { quoted: msg });
  },
};
