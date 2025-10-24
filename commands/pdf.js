import fs from "fs";
import pdf from "html-pdf";

export default {
  name: "pdf",
  description: "Convert text or webpage to PDF",
  async execute(sock, msg, args) {
    const input = args.join(" ");
    if (!input)
      return await sock.sendMessage(msg.key.remoteJid, {
        text: "📄 *Usage:* .pdf <text or URL>",
      });

    const content = input.startsWith("http")
      ? `<iframe src="${input}" style="width:100%;height:100vh;"></iframe>`
      : `<div style='font-size:16px;'>${input}</div>`;

    const filePath = "./temp.pdf";
    pdf.create(content).toFile(filePath, async (err) => {
      if (err) {
        return await sock.sendMessage(msg.key.remoteJid, { text: "❌ Failed to create PDF." });
      }
      await sock.sendMessage(msg.key.remoteJid, {
        document: { url: filePath },
        mimetype: "application/pdf",
        fileName: "NexOra.pdf",
        caption: "📄 Your PDF file is ready!",
      });
      fs.unlinkSync(filePath);
    });
  },
};
