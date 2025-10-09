import { isOwner } from "../utils/isOwner.js";

export default {
  name: "allgroups",
  description: "List all groups the bot is in (Owner only)",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Owner check
    if (!isOwner(sender)) {
      return sock.sendMessage(from, { text: "❌ Only owner can use this command!" }, { quoted: msg });
    }

    try {
      // ✅ Fetch all chats
      const chats = await sock.fetchChats();
      const groups = chats.filter(c => c.id.endsWith("@g.us"));

      if (!groups || groups.length === 0) {
        return sock.sendMessage(from, { text: "⚠️ The bot is not in any groups." }, { quoted: msg });
      }

      // ✅ Format the list
      const groupList = groups
        .map((g, i) => `${i + 1}. ${g.name || "Unnamed Group"}\n   ID: ${g.id}`)
        .join("\n\n");

      const message = `
📜 *All Groups (${groups.length})*

${groupList}
      `.trim();

      await sock.sendMessage(from, { text: message }, { quoted: msg });
    } catch (err) {
      console.error("Allgroups error:", err);
      await sock.sendMessage(from, { text: "⚠️ Failed to fetch groups." }, { quoted: msg });
    }
  },
};
