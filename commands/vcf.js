import fs from "fs";
import path from "path";
import { isAdmin } from "../utils/isAdmin.js";

export default {
  name: "vcf",
  description: "Generate a VCF file with all group members' contacts (Admin only)",

  async execute(sock, msg) {
    const groupId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Group only
    if (!groupId.endsWith("@g.us")) {
      await sock.sendMessage(groupId, { text: "⚠️ This command only works in groups." }, { quoted: msg });
      return;
    }

    // ✅ Admin check
    const admin = await isAdmin(sock, groupId, sender);
    if (!admin) {
      await sock.sendMessage(groupId, { text: "❌ Only *group admins* can use this command." }, { quoted: msg });
      return;
    }

    try {
      // 📥 Fetch group metadata
      const groupMetadata = await sock.groupMetadata(groupId);
      const participants = groupMetadata.participants;

      if (participants.length === 0) {
        await sock.sendMessage(groupId, { text: "⚠️ No participants found in this group." }, { quoted: msg });
        return;
      }

      // 📝 Build VCF content with names
      let vcfContent = "";
      for (const p of participants) {
        const number = p.id.split("@")[0];

        // 🧠 Try to get push name or use fallback
        const contactInfo = sock.contacts[p.id] || {};
        const displayName =
          contactInfo?.notify ||
          contactInfo?.name ||
          contactInfo?.verifiedName ||
          `+${number}`;

        vcfContent += `BEGIN:VCARD
VERSION:3.0
FN:${displayName}
TEL;type=CELL;type=VOICE;waid=${number}:${number}
END:VCARD
`;
      }

      // 💾 Save temp file
      const filePath = path.join("./", `group_contacts_${groupId.split("@")[0]}.vcf`);
      fs.writeFileSync(filePath, vcfContent.trim(), "utf8");

      // 📤 Send VCF file
      await sock.sendMessage(
        groupId,
        {
          document: fs.readFileSync(filePath),
          mimetype: "text/x-vcard",
          fileName: `GroupContacts_${groupMetadata.subject}.vcf`,
          caption: `📇 Group Contacts for *${groupMetadata.subject}*\n👥 Total: ${participants.length} members`,
        },
        { quoted: msg }
      );

      // 🧹 Clean up temp file
      fs.unlinkSync(filePath);

    } catch (err) {
      console.error("❌ VCF generation error:", err);
      await sock.sendMessage(groupId, { text: "❌ Failed to generate group contacts VCF file." }, { quoted: msg });
    }
  },
};
