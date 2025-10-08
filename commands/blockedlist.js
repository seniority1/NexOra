import { isOwner } from "../utils/isOwner.js";

export default {
  name: "blockedlist",
  description: "Show all users the bot has blocked (Owner only)",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const botName = "NexOra";
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Owner check
    if (!isOwner(sender)) {
      return sock.sendMessage(from, { text: "❌ Only owner can use this command!" }, { quoted: msg });
    }

    try {
      // ✅ Fetch blocked contacts
      const blocked = await sock.fetchBlocklist();

      if (!blocked || blocked.length === 0) {
        return sock.sendMessage(
          from,
          {
            text: `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
📜 *Blocked List*

✅ No users are currently blocked.
┗━━━━━━━━━━━━━━━━━━━━┛
            `.trim(),
          },
          { quoted: msg }
        );
      }

      // ✅ Format blocked list
      const blockedList = blocked
        .map((jid, i) => `${i + 1}. @${jid.split("@")[0]}`)
        .join("\n");

      const message = `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
📜 *Blocked Users (${blocked.length})*

${blockedList}

┗━━━━━━━━━━━━━━━━━━━━┛
      `.trim();

      await sock.sendMessage(from, { text: message, mentions: blocked }, { quoted: msg });
    } catch (err) {
      console.error("Blocked list error:", err);
      await sock.sendMessage(from, { text: "⚠️ Failed to retrieve blocked users." }, { quoted: msg });
    }
  },
};
