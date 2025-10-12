import fs from "fs";
import path from "path";
import { isAdmin } from "../utils/isAdmin.js";

export default {
  name: "vcf",
  description: "Generate a VCF file with all group members' contacts (Admin only)",
  
  async execute(sock, msg) {
    const groupId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Only groups
    if (!groupId.endsWith("@g.us")) {
      await sock.sendMessage(groupId, { text: "⚠️ This command only works in groups." }, { quoted: msg });
      return;
    }

    // ✅ Only admins
    const admin = await isAdmin(sock, groupId, sender);
    if (!admin) {
      await sock.sendMessage(groupId, { text: "❌ Only *group admins* can use this command." }, { quoted: msg });
      return;
    }

    try {
      // 📥 Get group members
      const groupMetadata = await sock.groupMetadata(groupId);
      const participants = groupMetadata.participants;

      if (!participants.length) {
        await sock.sendMessage(groupId, { text: "⚠️ No participants found." }, { quoted: msg });
        return;
      }

      let vcfContent = "";

      for (const p of participants) {
        const jid = p.id;
        const number = jid.split("@")[0];
        let displayName = `+${number}`;

        try {
          const [waInfo] = await sock.onWhatsApp(jid);
          if (waInfo?.notify || waInfo?.name) {
            displayName = waInfo.notify || waInfo.name;
          }
        } catch {
          // ignore errors, keep number
        }

        vcfContent += `BEGIN:VCARD
VERSION:3.0
FN:${displayName}
TEL;type=CELL;type=VOICE;waid=${number}: +${number}
END:VCARD
`;
      }

      // 📄 Save VCF file
      const fileName = `group_contacts_${Date.now()}.vcf`;
      const filePath = path.join("./", fileName);
      fs.writeFileSync(filePath, vcfContent, "utf8");

      // 📤 Send file back
      await sock.sendMessage(groupId, {
        document: fs.readFileSync(filePath),
        fileName,
        mimetype: "text/vcard",
      }, { quoted: msg });

      // 🧹 Delete temp file after sending
      fs.unlinkSync(filePath);

    } catch (err) {
      console.error("❌ VCF generation error:", err);
      await sock.sendMessage(groupId, { text: "❌ Failed to generate VCF file." }, { quoted: msg });
    }
  },
};
