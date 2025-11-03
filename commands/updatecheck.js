import https from "https";
import fs from "fs";
import path from "path";

const LOCAL_FILE = "./package.json"; // Used to check current version
const GITHUB_API_URL = "https://api.github.com/repos/seniority1/NexOra/commits/main";

export default {
  name: "updatecheck",
  description: "Check if a new update is available on GitHub (Owner only)",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const { isOwner } = await import("../utils/isOwner.js");

    if (!isOwner(sender)) {
      await sock.sendMessage(from, { text: "🚫 Only the owner can use this command." }, { quoted: msg });
      return;
    }

    await sock.sendMessage(from, { text: "🔍 Checking for updates..." }, { quoted: msg });

    try {
      https.get(
        GITHUB_API_URL,
        { headers: { "User-Agent": "NexOra-Bot" } },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              const json = JSON.parse(data);
              const latestHash = json.sha.slice(0, 7);

              const versionFile = path.resolve(LOCAL_FILE);
              let localVersion = "unknown";
              if (fs.existsSync(versionFile)) {
                const pkg = JSON.parse(fs.readFileSync(versionFile));
                localVersion = pkg.version || "unknown";
              }

              const message = `
╔══════════════════════════╗
║ 🔄  *UPDATE STATUS*  🔄
╚══════════════════════════╝

🧠 *Local Version:* ${localVersion}
🆕 *Latest Commit:* ${latestHash}

📦 Repository: *seniority1/NexOra*
🔗 GitHub: https://github.com/seniority1/NexOra

💡 Use *.update* to fetch and apply the latest version.
              `.trim();

              sock.sendMessage(from, { text: message }, { quoted: msg });
            } catch (e) {
              sock.sendMessage(from, { text: "⚠️ Failed to parse update data." }, { quoted: msg });
            }
          });
        }
      ).on("error", (err) => {
        sock.sendMessage(from, { text: `❌ Update check failed: ${err.message}` }, { quoted: msg });
      });
    } catch (err) {
      console.error("Update check error:", err);
      await sock.sendMessage(from, { text: "❌ Unable to check for updates." }, { quoted: msg });
    }
  },
};
