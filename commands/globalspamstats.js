import { spamDB } from "../utils/antispam.js";
import { isOwner } from "../utils/isOwner.js";

export default {
  name: "globalspamstats",
  description: "Owner-only command to view global spam statistics across all groups.",
  async execute(sock, msg, args, from, sender) {
    // ✅ Owner-only access
    if (!isOwner(sender)) {
      await sock.sendMessage(from, { text: "🚫 Only the bot owner can view global spam stats." });
      return;
    }

    if (spamDB.size === 0) {
      await sock.sendMessage(from, { text: "✅ No spam records found globally." });
      return;
    }

    let report = "🌐 *Global Spam Stats*\n\n";
    let totalUsers = 0;

    for (const [groupId, db] of spamDB.entries()) {
      const groupName = groupId.replace("@g.us", "");
      const userCount = db.length;
      totalUsers += userCount;

      report += `📍 *Group:* ${groupName}\n👥 *Flagged Users:* ${userCount}\n\n`;
    }

    report += `📊 *Total Groups:* ${spamDB.size}\n🧍 *Total Flagged Users:* ${totalUsers}`;

    await sock.sendMessage(from, { text: report });
  },
};
