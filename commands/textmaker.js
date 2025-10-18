export default {
  name: "textmaker",
  description: "Show text maker commands list",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;

    // ✅ Use the raw GitHub link so the image loads properly
    const bannerUrl = "https://raw.githubusercontent.com/seniority1/NexOra-files/main/file_00000000f45c61fbab4dc8d5d417130b.png";

    const reply = `
🎨 *TEXT MAKER CATEGORY* 🎨

🖋️ *Stylish & Fun Text:*
1️⃣ .fancy <text> → Stylish fonts  
2️⃣ .glitch <text> → Glitch logo  
3️⃣ .graffiti <text> → Graffiti style  

💡 *Logo Effects:*
4️⃣ .neon <text> → Glowing neon logo  
5️⃣ .fire <text> → Burning fire text  
6️⃣ .ice <text> → Frozen icy logo  
7️⃣ .joker <text> → Joker-style text  
8️⃣ .spark <text> → Sparkling metallic logo  

✨ *Tip:* Try short names or phrases for best results!
    `;

    await sock.sendMessage(
      from,
      {
        image: { url: bannerUrl },
        caption: reply.trim(),
      },
      { quoted: msg }
    );
  },
};
