// commands/listinactive.js
import { isAdmin } from "../utils/isAdmin.js";
import { getGroupActivity } from "../utils/activityTracker.js";

export default {
  name: "listinactive",
  description: "Show the least active members in the group (Admin only)",
  async execute(sock, msg, args) {
    const groupId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Only works in groups
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

    // ✅ Fetch activity data
    const activity = getGroupActivity(groupId);
    if (!activity || Object.keys(activity).length === 0) {
      await sock.sendMessage(groupId, { text: "📭 No activity data available yet." }, { quoted: msg });
      return;
    }

    // ✅ Sort by lowest message count
    const sorted = Object.entries(activity)
      .sort(([, a], [, b]) => a - b)
      .slice(0, 10); // show bottom 10

    const totalMessages = Object.values(activity).reduce((a, b) => a + b, 0);
    let leaderboard = "😴 *Least Active Members:*\n\n";

    sorted.forEach(([jid, count], i) => {
      leaderboard += `${i + 1}. @${jid.split("@")[0]} — ${count} messages\n`;
    });

    leaderboard += `\n💤 Total messages tracked: *${totalMessages}*`;

    await sock.sendMessage(groupId, {
      text: leaderboard,
      mentions: sorted.map(([jid]) => jid),
    }, { quoted: msg });
  },
};
