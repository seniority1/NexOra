import { isAdmin } from "../utils/isAdmin.js";
import fs from "fs";

const RULES_FILE = "./data/group_rules.json";

export default {
  name: "clearrules",
  description: "Clear group rules (Admin only)",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Group only
    if (!from.endsWith("@g.us")) {
      return sock.sendMessage(from, { text: "⚠️ This command only works in groups." }, { quoted: msg });
    }

    // ✅ Admin only
    if (!(await isAdmin(sock, from, sender))) {
      return sock.sendMessage(from, { text: "❌ Only *group admins* can clear rules." }, { quoted: msg });
    }

    if (!fs.existsSync(RULES_FILE)) {
      return sock.sendMessage(from, { text: "⚠️ No rules found to clear." }, { quoted: msg });
    }

    const rulesData = JSON.parse(fs.readFileSync(RULES_FILE));
    if (!rulesData[from]) {
      return sock.sendMessage(from, { text: "⚠️ No rules have been set for this group." }, { quoted: msg });
    }

    delete rulesData[from];
    fs.writeFileSync(RULES_FILE, JSON.stringify(rulesData, null, 2));

    await sock.sendMessage(from, {
      text: "🧹 Group rules have been *cleared* successfully.",
    }, { quoted: msg });
  },
};
