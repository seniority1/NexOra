// commands/creategc.js
import { isOwner } from "../utils/isOwner.js";

export default {
  name: "creategc",
  description: "Create a new WhatsApp group (Owner only)",
  async execute(sock, msg, args, from, sender) {
    const owner = isOwner(sender);

    if (!owner) {
      await sock.sendMessage(
        from,
        { text: "🚫 Only the bot owner can create a new group." },
        { quoted: msg }
      );
      return;
    }

    const groupName = args.join(" ")?.trim();
    if (!groupName) {
      await sock.sendMessage(
        from,
        {
          text: "⚠️ Please provide a group name.\n\nExample:\n.creategc NexOra Fans",
        },
        { quoted: msg }
      );
      return;
    }

    try {
      // Create group with sender as the initial member
      const group = await sock.groupCreate(groupName, [sender]);
      const inviteCode = await sock.groupInviteCode(group.id);

      await sock.sendMessage(
        from,
        {
          text: `✅ Group *${groupName}* created successfully!\n\n👑 Created by: @${sender.split("@")[0]}\n🔗 Invite link:\nhttps://chat.whatsapp.com/${inviteCode}`,
          mentions: [sender],
        },
        { quoted: msg }
      );
    } catch (err) {
      console.error("❌ Error creating group:", err);
      await sock.sendMessage(
        from,
        { text: "⚠️ Failed to create group. Try again later." },
        { quoted: msg }
      );
    }
  },
};
