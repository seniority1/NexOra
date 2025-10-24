import fs from "fs";
import AdmZip from "adm-zip";
import { isOwner } from "../utils/isOwner.js";

export default {
  name: "backup",
  description: "Backup bot settings (Owner only)",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Owner-only check
    if (!isOwner(sender)) {
      return sock.sendMessage(
        from,
        { text: "❌ Only the owner can use this command!" },
        { quoted: msg }
      );
    }

    try {
      // 🧠 Load mode and owner info
      let mode = "public";
      let owners = [];

      if (fs.existsSync("./mode.json")) {
        const modeData = JSON.parse(fs.readFileSync("./mode.json"));
        mode = modeData.mode || "public";
      }

      if (fs.existsSync("./config.json")) {
        const configData = JSON.parse(fs.readFileSync("./config.json"));
        owners = configData.owner || [];
      }

      // 📁 Create backup data
      const backupData = {
        bot_name: "NexOra",
        backup_date: new Date().toLocaleString(),
        settings: {
          mode,
          owners,
        },
      };

      // ✍️ Write to JSON
      const backupFile = "./settings_backup.json";
      fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));

      // 📦 Zip the file
      const zip = new AdmZip();
      zip.addLocalFile(backupFile);
      const zipPath = "./NexOra-Settings-Backup.zip";
      zip.writeZip(zipPath);

      // 📤 Send to owner
      await sock.sendMessage(
        from,
        {
          document: { url: zipPath },
          mimetype: "application/zip",
          fileName: "NexOra-Settings-Backup.zip",
          caption: "✅ Backup created successfully!\nContains bot settings (owner numbers & mode).",
        },
        { quoted: msg }
      );

      // 🧹 Cleanup
      fs.unlinkSync(backupFile);
      fs.unlinkSync(zipPath);
    } catch (err) {
      console.error("Backup error:", err);
      await sock.sendMessage(from, { text: "⚠️ Failed to create backup." }, { quoted: msg });
    }
  },
};
