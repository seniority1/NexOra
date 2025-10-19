import fs from "fs";
import https from "https";
import AdmZip from "adm-zip";
import { exec } from "child_process";

const GITHUB_ZIP_URL = "https://github.com/seniority1/NexOra/archive/refs/heads/main.zip";
const ZIP_PATH = "./update.zip";

function downloadZip(url, dest, callback) {
  https.get(url, (res) => {
    // 🔁 Handle redirect (302)
    if (res.statusCode === 302 && res.headers.location) {
      return downloadZip(res.headers.location, dest, callback);
    }

    if (res.statusCode !== 200) {
      return callback(new Error(`Failed to download ZIP (status ${res.statusCode})`));
    }

    const fileStream = fs.createWriteStream(dest);
    res.pipe(fileStream);
    fileStream.on("finish", () => fileStream.close(callback));
  }).on("error", (err) => callback(err));
}

export default {
  name: "update",
  description: "Update bot from GitHub (Owner only)",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    // 🧠 Owner check
    const { isOwner } = await import("../utils/isOwner.js");
    if (!isOwner(sender)) {
      await sock.sendMessage(from, { text: "❌ Only the owner can use this command!" }, { quoted: msg });
      return;
    }

    await sock.sendMessage(from, { text: "📥 Downloading latest update from GitHub..." }, { quoted: msg });

    downloadZip(GITHUB_ZIP_URL, ZIP_PATH, (err) => {
      if (err) {
        console.error("Update error:", err);
        sock.sendMessage(from, { text: `❌ Update failed: ${err.message}` }, { quoted: msg });
        return;
      }

      try {
        // 📦 Extract ZIP to current directory
        const zip = new AdmZip(ZIP_PATH);
        zip.extractAllTo("./", true);
        fs.unlinkSync(ZIP_PATH);

        // 🟩 Final update message (before restart)
        const doneMessage = `
╔══════════════════════════╗
║ ✅  *UPDATE COMPLETE*  ✅
╚══════════════════════════╝

🚀 The bot has been successfully updated to the latest version from GitHub.

📦 All files extracted and dependencies will be installed.
🔄 Restarting the bot now...
        `.trim();

        sock.sendMessage(from, { text: doneMessage }, { quoted: msg });

        // 🔄 Restart the bot process
        exec("npm install --legacy-peer-deps && pm2 restart all || node index.js", (error, stdout, stderr) => {
          if (error) {
            console.error(`Restart error: ${error}`);
            sock.sendMessage(from, { text: "⚠️ Update extracted but failed to restart. Please restart manually." }, { quoted: msg });
            return;
          }

          console.log(stdout);
          console.error(stderr);

          // ✅ Post-restart success message
          const restartMessage = `
╔══════════════════════════╗
║ 🚀  *RESTART COMPLETE*  🚀
╚══════════════════════════╝

✅ The bot has been successfully restarted and is now running the latest version.
          `.trim();

          sock.sendMessage(from, { text: restartMessage }, { quoted: msg });
        });

      } catch (e) {
        console.error("Extraction error:", e);
        sock.sendMessage(from, { text: `❌ Failed to extract update: ${e.message}` }, { quoted: msg });
      }
    });
  },
};
