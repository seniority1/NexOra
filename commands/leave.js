import { isOwner } from "../utils/isOwner.js";

export default {
  name: "leave",
  description: "Owner-only: Make the bot leave a group",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Owner check
    if (!isOwner(sender)) {
      await sock.sendMessage(from, { text: "❌ Only owner can use this!" }, { quoted: msg });
      return;
    }

    let targetGroup;

    // If command is used inside a group → target that group
    if (from.endsWith("@g.us")) {
      targetGroup = from;
    }

    // If owner passed a group ID as argument (useful from private chat)
    if (!targetGroup && args.length > 0) {
      let groupId = args[0].trim();
      if (!groupId.includes("@g.us")) {
        groupId = `${groupId}@g.us`;
      }
      targetGroup = groupId;
    }

    if (!targetGroup) {
      await sock.sendMessage(from, { text: "⚠️ Use this command inside a group or provide a group ID.\n\nExample: `.leave 1234567890-123456@g.us`" }, { quoted: msg });
      return;
    }

    try {
      await sock.sendMessage(targetGroup, { text: "👋 NexOra is leaving this group..." });
      await sock.groupLeave(targetGroup);

      // Confirm to owner
      if (targetGroup !== from) {
        await sock.sendMessage(from, { text: `✅ Successfully left group: ${targetGroup}` }, { quoted: msg });
      }
    } catch (err) {
      console.error("❌ Leave command error:", err);
      await sock.sendMessage(from, { text: "❌ Failed to leave the group." }, { quoted: msg });
    }
  },
};
