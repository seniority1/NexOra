import fs from "fs";
import archiver from "archiver";
import { isOwner } from "../utils/isOwner.js";

export default {
  name: "backup",
  description: "Backup bot data (Owner only)",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const botName = "NexOra";

    if (!isOwner(sender))
      return sock.sendMessage(from, { text: "❌ Only owner can use this command!" }, { quoted: msg });

    const zipFile = "./backup.zip";
    const output = fs.createWriteStream(zipFile);
    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.pipe(output);
    archive.directory("./session", "session");
    archive.directory("./data", "data");
    archive.finalize();

    output.on("close", async () => {
      await sock.sendMessage(from, {
        document: { url: zipFile },
        mimetype: "application/zip",
        fileName: "NexOra-Backup.zip",
        caption: "📦 Backup created successfully!",
      });
      fs.unlinkSync(zipFile);
    });
  },
};
