// commands/repo.js
export default {
  name: "repo",
  description: "Get the official NexOra GitHub repository and deployment guide",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;

    const text = `
📦 *NexOra Official Repository*
🔗 GitHub: https://github.com/seniority1/NexOra.git

🧠 *Deploy Guide*
1️⃣ Download NexOra bot files  
2️⃣ Upload the files to any *Pterodactyl Panel*  
3️⃣ Open and edit the \`config.js\` — replace the two numbers with your own  
4️⃣ Move to the \`../environment\` directory  
5️⃣ Start the panel  
6️⃣ Wait for the “✅ Connected successfully” message  

> ⚙️ Easy setup, instant start.  
> 💡 Powered by *NexOra AI*
`;

    await sock.sendMessage(from, { text }, { quoted: msg });
  },
};
