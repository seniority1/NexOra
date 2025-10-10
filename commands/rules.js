import fs from "fs";

const RULES_FILE = "./data/group_rules.json";

export default {
  name: "rules",
  description: "Show group rules",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;

    // ✅ Must be in a group
    if (!from.endsWith("@g.us")) {
      return sock.sendMessage(from, { text: "⚠️ This command only works in groups." }, { quoted: msg });
    }

    // 📖 Check if rules file exists
    if (!fs.existsSync(RULES_FILE)) {
      return sock.sendMessage(from, { text: "📜 No rules have been set for this group yet." }, { quoted: msg });
    }

    const rulesData = JSON.parse(fs.readFileSync(RULES_FILE));
    const groupRules = rulesData[from];

    if (!groupRules) {
      return sock.sendMessage(from, { text: "📜 No rules have been set for this group yet." }, { quoted: msg });
    }

    const reply = `
┏━━📜 *GROUP RULES* 📜━━┓

${groupRules}

┗━━━━━━━━━━━━━━━━━━━━┛
    `;

    await sock.sendMessage(from, { text: reply.trim() }, { quoted: msg });
  },
};
