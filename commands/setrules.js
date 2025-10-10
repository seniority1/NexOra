import { isAdmin } from "../utils/isAdmin.js";
import fs from "fs";

const RULES_FILE = "./data/group_rules.json";

// 📌 Ensure rules file exists
if (!fs.existsSync(RULES_FILE)) {
  fs.writeFileSync(RULES_FILE, JSON.stringify({}));
}

export default {
  name: "setrules",
  description: "Set group rules (Admin only)",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Group only
    if (!from.endsWith("@g.us")) {
      return sock.sendMessage(from, { text: "⚠️ This command only works in groups." }, { quoted: msg });
    }

    // ✅ Admin only
    if (!(await isAdmin(sock, from, sender))) {
      return sock.sendMessage(from, { text: "❌ Only *group admins* can set rules." }, { quoted: msg });
    }

    const rulesText = args.join(" ").trim();
    if (!rulesText) {
      return sock.sendMessage(from, { text: "⚠️ Usage: `.setrules <group rules>`" }, { quoted: msg });
    }

    // 📝 Save rules
    const rulesData = JSON.parse(fs.readFileSync(RULES_FILE));
    rulesData[from] = rulesText;
    fs.writeFileSync(RULES_FILE, JSON.stringify(rulesData, null, 2));

    await sock.sendMessage(from, {
      text: "✅ Group rules have been *updated* successfully.",
    }, { quoted: msg });
  },
};
