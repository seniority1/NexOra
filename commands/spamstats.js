import { isAdmin } from "../utils/isAdmin.js";
import { spamDB } from "../utils/antispam.js"; // We'll export it in a second
import { isOwner } from "../utils/isOwner.js";

export default {
  name: "spamstats",
  description: "Show spam tracking info for this group.",
  async execute(sock, msg, args, from, sender) {
    const isGroup = from.endsWith("@g.us");
    if (!isGroup) {
      await sock.sendMessage(from, { text: "⚠️ This command works only in groups." });
      return;
    }

    const admin = await isAdmin(sock, from, sender);
    const owner = isOwner(sender);
    if (!admin && !owner) {
      await sock.sendMessage(from, { text: "🚫 Only admins or the owner can use this." });
      return;
    }

    const groupSpam = spamDB.get(from);
    if (!groupSpam || groupSpam.length === 0) {
      await sock.sendMessage(from, { text: "✅ No spam activity recorded in this group." });
      return;
    }

    let report = "📊 *Spam Stats (Last 10m)*\n\n";
    for (const user of groupSpam) {
      report += `👤 @${user.id.split("@")[0]} → ${user.spam} commands\n`;
    }

    await sock.sendMessage(from, { text: report, mentions: groupSpam.map((u) => u.id) });
  },
};
