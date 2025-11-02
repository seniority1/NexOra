// commands/repo.js
export default {
  name: "repo",
  description: "Get the official NexOra GitHub repository and deployment guide",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const mention = `@${sender.split("@")[0]}`;

    const text = `
📦 *NexOra Official Repository*
🔗 GitHub: https://github.com/seniority1/NexOra.git

⭐ *Hey ${mention}!*
Remember to *Star ⭐* and *Fork 🍴* the repo before deploying —
real devs always show love 💖

🧠 *Deploy Guide*
1️⃣ Download or clone your forked NexOra bot files  
2️⃣ Upload them to any *Pterodactyl Panel*  
3️⃣ Open and edit \`config.js\` — replace the two numbers with yours  
4️⃣ Move to the \`../environment\` directory  
5️⃣ Start the panel  
6️⃣ Wait for the “✅ Connected successfully” message  

> ⚙️ Easy setup, instant start  
> 💡 Powered by *NexOra AI*  
> 👑 Created by *Seniority*
`;

    await sock.sendMessage(from, {
      text,
      mentions: [sender],
    }, { quoted: msg });
  },
};
