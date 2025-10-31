// commands/listonline.js
import { isAdmin } from "../utils/isAdmin.js";

export default {
  name: "listonline",
  description: "Show currently online members in the group (Admin only)",
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

    try {
      // 🧠 Fetch group metadata
      const groupMetadata = await sock.groupMetadata(groupId);
      const participants = groupMetadata.participants.map(p => p.id);

      // 👁️ Get online presence from the socket store
      const store = sock.store?.presence || {};
      const onlineUsers = [];

      for (const user of participants) {
        const presence = store[groupId]?.[user]?.lastKnownPresence || "unavailable";
        if (presence === "available" || presence === "composing" || presence === "recording") {
          onlineUsers.push(user);
        }
      }

      // 🧾 Create message
      if (onlineUsers.length === 0) {
        await sock.sendMessage(groupId, { text: "📵 No one is online right now." }, { quoted: msg });
      } else {
        const list = onlineUsers.map((jid, i) => `${i + 1}. @${jid.split("@")[0]}`).join("\n");
        const text = `🟢 *Online Members:*\n\n${list}\n\n👥 Total: *${onlineUsers.length}*`;
        await sock.sendMessage(groupId, { text, mentions: onlineUsers }, { quoted: msg });
      }
    } catch (err) {
      console.error("❌ listonline error:", err);
      await sock.sendMessage(groupId, { text: "⚠️ Failed to fetch online list." }, { quoted: msg });
    }
  },
};
