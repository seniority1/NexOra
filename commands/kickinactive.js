// commands/kickinactive.js
import { isAdmin } from "../utils/isAdmin.js";
import { getInactiveUsers } from "../utils/activityTracker.js";

export default {
  name: "kickinactive",
  description: "Remove inactive members (Admin only)",
  async execute(sock, msg, args) {
    const group = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Check if it's a group
    if (!group.endsWith("@g.us")) {
      await sock.sendMessage(group, { text: "⚠️ This command only works in groups." }, { quoted: msg });
      return;
    }

    // ✅ Check admin
    const admin = await isAdmin(sock, group, sender);
    if (!admin) {
      await sock.sendMessage(group, { text: "❌ Only *group admins* can use this command." }, { quoted: msg });
      return;
    }

    // 📆 Get threshold (default 7 days)
    const days = parseInt(args[0]) || 7;

    await sock.sendMessage(group, { text: `🕵️ Scanning for members inactive for *${days} days*...` }, { quoted: msg });

    try {
      const metadata = await sock.groupMetadata(group);
      const participants = metadata.participants;
      const inactiveUsers = getInactiveUsers(group, days);

      // Exclude admins from removal
      const admins = participants.filter(p => p.admin).map(p => p.id);
      const toKick = inactiveUsers.filter(u => !admins.includes(u));

      if (toKick.length === 0) {
        await sock.sendMessage(group, { text: "✅ No inactive members found." }, { quoted: msg });
        return;
      }

      await sock.sendMessage(group, {
        text: `🧹 Removing ${toKick.length} inactive members...`,
      });

      for (const user of toKick) {
        await sock.groupParticipantsUpdate(group, [user], "remove");
        await new Promise(r => setTimeout(r, 1500)); // Delay between removals
      }

      await sock.sendMessage(group, {
        text: `✅ Removed ${toKick.length} inactive member(s) who were inactive for over *${days} days*.`,
      });

    } catch (err) {
      console.error("❌ KickInactive error:", err);
      await sock.sendMessage(group, { text: "⚠️ Error while removing inactive members." }, { quoted: msg });
    }
  },
};
