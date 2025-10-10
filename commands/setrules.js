import fs from "fs";

const RULES_FILE = "./data/group_rules.json";

export default {
  name: "setrules",
  description: "Set group rules (Admin only)",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;

    // ✅ Check group
    if (!from.endsWith("@g.us")) {
      return sock.sendMessage(from, { text: "⚠️ This command only works in groups." }, { quoted: msg });
    }

    // ✅ Check admin
    const groupMetadata = await sock.groupMetadata(from);
    const participant = groupMetadata.participants.find(p => p.id === (msg.key.participant || from));
    if (!participant || (participant.admin !== "admin" && participant.admin !== "superadmin")) {
      return sock.sendMessage(from, { text: "❌ Only group admins can set rules." }, { quoted: msg });
    }

    // 📝 Check rules text
    const rulesText = args.join(" ").trim();
    if (!rulesText) {
      return sock.sendMessage(from, { text: "⚠️ Usage: `.setrules <rules text>`" }, { quoted: msg });
    }

    // 📁 Ensure rules file exists
    if (!fs.existsSync("./data")) fs.mkdirSync("./data", { recursive: true });
    let rulesData = {};
    if (fs.existsSync(RULES_FILE)) {
      rulesData = JSON.parse(fs.readFileSync(RULES_FILE));
    }

    // 💾 Save rules
    rulesData[from] = rulesText;
    fs.writeFileSync(RULES_FILE, JSON.stringify(rulesData, null, 2));

    // ✅ Confirmation + Preview
    const reply = `
┏━━✅ *GROUP RULES UPDATED* ✅━━┓

📜 *New Rules:*
${rulesText}

┗━━━━━━━━━━━━━━━━━━━━┛
    `;

    await sock.sendMessage(from, { text: reply.trim() }, { quoted: msg });
  },
};
