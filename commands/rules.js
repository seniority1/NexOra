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

    // 📖 Load rules data
    let rulesData = {};
    if (fs.existsSync(RULES_FILE)) {
      rulesData = JSON.parse(fs.readFileSync(RULES_FILE));
    }

    const groupRules = rulesData[from];

    // ❌ No rules found → mention admins to remind them
    if (!groupRules) {
      const metadata = await sock.groupMetadata(from);
      const adminParticipants = metadata.participants.filter(p => p.admin === "admin" || p.admin === "superadmin");
      const adminMentions = adminParticipants.map(a => a.id);

      const reminderText = `
📜 *No rules have been set for this group yet!*

👑 *Admins*, please set rules using:  
\`.setrules <your rules>\`
      `;

      return sock.sendMessage(
        from,
        {
          text: reminderText.trim(),
          mentions: adminMentions,
        },
        { quoted: msg }
      );
    }

    // ✅ Show rules
    const reply = `
┏━━📜 *GROUP RULES* 📜━━┓

${groupRules}

┗━━━━━━━━━━━━━━━━━━━━┛
    `;

    await sock.sendMessage(from, { text: reply.trim() }, { quoted: msg });
  },
};
