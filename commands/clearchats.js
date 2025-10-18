import { isOwner } from "../utils/isOwner.js";

export default {
  name: "clearchats",
  description: "Clear all messages from a chat (Owner only)",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const botName = "NexOra";
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Owner check
    if (!isOwner(sender)) {
      return sock.sendMessage(from, { text: "❌ Only owner can use this command!" }, { quoted: msg });
    }

    try {
      // ✅ Clear chat
      await sock.chatModify(
        {
          clear: {
            messages: [
              {
                id: msg.key.id,
                fromMe: false,
              },
            ],
          },
        },
        from
      );

      await sock.sendMessage(
        from,
        {
          text: `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
🧼 *Chat has been cleared successfully!*
┗━━━━━━━━━━━━━━━━━━━━┛
          `.trim(),
        },
        { quoted: msg }
      );
    } catch (err) {
      console.error("ClearChats error:", err);
      await sock.sendMessage(from, { text: "❌ Failed to clear chat." }, { quoted: msg });
    }
  },
};
