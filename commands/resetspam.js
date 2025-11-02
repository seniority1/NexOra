import { spamDB } from "../utils/antispam.js";
import { isAdmin } from "../utils/isAdmin.js";
import { isOwner } from "../utils/isOwner.js";

export default {
  name: "resetspam",
  description: "Reset all spam data for this group.",
  async execute(sock, msg, args, from, sender) {
    const isGroup = from.endsWith("@g.us");
    if (!isGroup) {
      await sock.sendMessage(from, { text: "⚠️ This command only works in groups." });
      return;
    }

    const admin = await isAdmin(sock, from, sender);
    const owner = isOwner(sender);
    if (!admin && !owner) {
      await sock.sendMessage(from, { text: "🚫 Only admins or the owner can reset spam stats." });
      return;
    }

    if (spamDB.has(from)) {
      spamDB.delete(from);
      await sock.sendMessage(from, { text: "✅ Spam data for this group has been cleared." });
    } else {
      await sock.sendMessage(from, { text: "ℹ️ No spam data found to reset." });
    }
  },
};
