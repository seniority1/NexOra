import { isOwner } from "../utils/isOwner.js";

export default {
  name: "block",
  description: "Block a user (Owner only)",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const botName = "NexOra";
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Owner check
    if (!isOwner(sender)) {
      return sock.sendMessage(from, { text: "❌ Only owner can use this command!" }, { quoted: msg });
    }

    // ✅ Get target
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    const repliedUser = msg.message?.extendedTextMessage?.contextInfo?.participant;
    const numberArg = args[0];

    let target;

    if (mentioned) {
      target = mentioned;
    } else if (repliedUser) {
      target = repliedUser;
    } else if (numberArg) {
      target = numberArg.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
    }

    // ✅ If no target, show usage
    if (!target) {
      return sock.sendMessage(
        from,
        {
          text: `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
🛑 *Block Command (Owner Only)*

📘 Usage:
• Reply to user →  *.block*
• Mention user →  *.block @user*
• Use number →  *.block 2348089821951*
┗━━━━━━━━━━━━━━━━━━━━┛
          `.trim(),
        },
        { quoted: msg }
      );
    }

    // ✅ Try to block
    try {
      await sock.updateBlockStatus(target, "block");
      await sock.sendMessage(
        from,
        {
          text: `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
✅ Successfully blocked @${target.split("@")[0]}
┗━━━━━━━━━━━━━━━━━━━━┛
          `.trim(),
          mentions: [target],
        },
        { quoted: msg }
      );
    } catch (err) {
      console.error("Block error:", err);
      await sock.sendMessage(from, { text: "❌ Failed to block user." }, { quoted: msg });
    }
  },
};
