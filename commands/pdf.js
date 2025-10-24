import fs from "fs";
import PDFDocument from "pdfkit";

export default {
  name: "pdf",
  description: "Convert text to a downloadable PDF",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const inputText = args.join(" ");

    // If no text provided, show usage guide
    if (!inputText) {
      return sock.sendMessage(
        from,
        {
          text: `
📘 *PDF Command Usage:*
> Create a PDF file from your text.

🧩 *Example:*
.pdf This is my first NexOra PDF! 📄
          `.trim(),
        },
        { quoted: msg }
      );
    }

    try {
      // ✅ Create a unique filename
      const filePath = `./temp_${Date.now()}.pdf`;

      // ✅ Create the PDF
      const doc = new PDFDocument();
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);
      doc.fontSize(14).text(inputText, { align: "left" });
      doc.end();

      // Wait for file to finish writing
      await new Promise((resolve) => writeStream.on("finish", resolve));

      // ✅ Send the PDF
      await sock.sendMessage(
        from,
        {
          document: fs.readFileSync(filePath),
          mimetype: "application/pdf",
          fileName: "NexOra.pdf",
          caption: "📄 Here’s your generated PDF!",
        },
        { quoted: msg }
      );

      // Delete file after sending
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error("PDF command error:", err);
      await sock.sendMessage(
        from,
        { text: "❌ Failed to generate PDF. Please try again." },
        { quoted: msg }
      );
    }
  },
};
