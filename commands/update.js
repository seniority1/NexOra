import fs from "fs";
import https from "https";
import AdmZip from "adm-zip";
import path from "path";

const GITHUB_ZIP_URL = "https://github.com/seniority1/NexOra/archive/refs/heads/main.zip";
const ZIP_PATH = "./update.zip";

function downloadZip(url, dest, callback) {
  https.get(url, (res) => {
    // Handle redirect (302)
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
  description: "Update bot commands from GitHub (Owner only)",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const { isOwner } = await import("../utils/isOwner.js");

    if (!isOwner(sender)) {
      await sock.sendMessage(from, { text: "🚫 Only the owner can use this command." }, { quoted: msg });
      return;
    }

    await sock.sendMessage(from, { text: "📦 Fetching latest *command updates* from GitHub..." }, { quoted: msg });

    downloadZip(GITHUB_ZIP_URL, ZIP_PATH, (err) => {
      if (err) {
        sock.sendMessage(from, { text: `❌ Download failed: ${err.message}` }, { quoted: msg });
        return;
      }

      try {
        const zip = new AdmZip(ZIP_PATH);
        const entries = zip.getEntries();

        // Path inside zip, e.g. NexOra-main/commands/
        const COMMANDS_FOLDER = "NexOra-main/commands/";
        const COMMANDS_DIR = "./commands";
        const UPDATED_FILE = "./updated.json";

        // Save list before update
        let oldCommands = [];
        if (fs.existsSync(COMMANDS_DIR)) {
          oldCommands = fs.readdirSync(COMMANDS_DIR).filter(f => f.endsWith(".js"));
        }

        let updatedCount = 0;
        entries.forEach((entry) => {
          if (entry.entryName.startsWith(COMMANDS_FOLDER) && !entry.isDirectory) {
            const relativePath = entry.entryName.replace(COMMANDS_FOLDER, "");
            const outputPath = path.join(COMMANDS_DIR, relativePath);

            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
            fs.writeFileSync(outputPath, entry.getData());
            updatedCount++;
          }
        });

        fs.unlinkSync(ZIP_PATH);

        // Compare new vs old command files
        const newCommands = fs
          .readdirSync(COMMANDS_DIR)
          .filter(f => f.endsWith(".js") && !oldCommands.includes(f));

        // Save new ones in updated.json
        fs.writeFileSync(
          UPDATED_FILE,
          JSON.stringify({ added: newCommands, date: new Date() }, null, 2)
        );

        const newCmdText =
          newCommands.length > 0
            ? `🆕 *New Commands Added:*\n${newCommands.map(c => `• .${c.replace(".js", "")}`).join("\n")}`
            : "✅ No new commands were added this time.";

        const message = `
╔══════════════════════════╗
║ ✅  *COMMANDS UPDATED*  ✅
╚══════════════════════════╝

🧠 Updated ${updatedCount} command files from GitHub.
⚙️ Your local bot settings, sessions, and utils remain untouched.

${newCmdText}

💡 Restart the bot to apply changes:
> .restart
        `.trim();

        sock.sendMessage(from, { text: message }, { quoted: msg });
      } catch (e) {
        sock.sendMessage(from, { text: `❌ Extraction error: ${e.message}` }, { quoted: msg });
      }
    });
  },
};
