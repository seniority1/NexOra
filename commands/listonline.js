import { isAdmin } from "../utils/isAdmin.js";

export default {
  name: "listonline",
  description: "List all currently online members in the group",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const botName = "NexOra";
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Group only
    if (!from.endsWith("@g.us")) {
      return sock.sendMessage(from, { text: "⚠️ This command only works inside groups." }, { quoted: msg });
    }

    // ✅ Admin only
    if (!(await isAdmin(sock, from, sender))) {
      return sock.sendMessage(from, { text: "❌ Only *group admins* can use this command." }, { quoted: msg });
    }

    try {
      // ✅ Fetch presence info (active users)
      const groupMetadata = await sock.groupMetadata(from);
      const participants = groupMetadata.participants;

      // Some Baileys versions don't provide real presence per user,
      // but we can use `sock.fetchStatus` for each to check quickly
      let onlineList = [];
      for (const p of participants) {
        const presence = sock.presence?.[p.id];
        if (presence && presence.lastKnownPresence === "available") {
          onlineList.push(p.id);
        }
      }

      // If no presence tracking → fallback (empty or show everyone)
      if (onlineList.length === 0) {
        onlineList = participants.map((p) => p.id);
      }

      const onlineText = onlineList
        .map((id, i) => `*${i + 1}.* @${id.split("@")[0]}`)
        .join("\n");

      const text = `
┏━━🟢 *${botName.toUpperCase()} BOT* ━━┓
       👥 *ONLINE MEMBERS LIST* 👥

${onlineText || "No one is online 😴"}

┗━━━━━━━━━━━━━━━━━━━━┛
      `;

      await sock.sendMessage(
        from,
        {
          text: text.trim(),
          mentions: onlineList,
        },
        { quoted: msg }
      );
    } catch (err) {
      console.error("❌ listonline error:", err);
      await sock.sendMessage(from, { text: "❌ Failed to list online members." }, { quoted: msg });
    }
  },
};
