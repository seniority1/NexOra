import { isAdmin } from "../utils/isAdmin.js";

export default {
  name: "promote",
  description: "Promote a tagged member to admin (Admins only)",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const botNumber = sock.user.id.split(":")[0] + "@s.whatsapp.net";
    const botName = "NexOra";

    // ✅ Check group
    if (!from.endsWith("@g.us")) {
      return sock.sendMessage(from, { text: "⚠️ This command only works inside groups." }, { quoted: msg });
    }

    // ✅ Check if sender is admin
    if (!(await isAdmin(sock, from, sender))) {
      return sock.sendMessage(from, { text: "❌ Only *group admins* can use this command." }, { quoted: msg });
    }

    // ✅ Get mentioned user or quoted user
    let target;
    const message = msg.message?.extendedTextMessage || msg.message?.conversation;

    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
      target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
      target = msg.message.extendedTextMessage.contextInfo.participant;
    } else {
      return sock.sendMessage(from, { text: "⚠️ Tag or reply to the user you want to *promote*." }, { quoted: msg });
    }

    // 🛑 Prevent promoting bot or self unnecessarily
    if (target === botNumber) {
      return sock.sendMessage(from, { text: "🤖 I’m already an admin or cannot promote myself." }, { quoted: msg });
    }

    try {
      // 📈 Promote the target
      await sock.groupParticipantsUpdate(from, [target], "promote");

      const text = `
┏━━🆙 *${botName.toUpperCase()} BOT* ━━┓
   👑 *PROMOTION SUCCESSFUL* 👑

👤 Promoted by: @${sender.split("@")[0]}  
🎯 New Admin: @${target.split("@")[0]}

Use .demote to remove admin rights.
┗━━━━━━━━━━━━━━━━━━━━┛
      `.trim();

      await sock.sendMessage(
        from,
        { text, mentions: [sender, target] },
        { quoted: msg }
      );
    } catch (err) {
      console.error("❌ Promote error:", err);
      await sock.sendMessage(from, { text: "❌ Failed to promote user. Make sure I’m an admin." }, { quoted: msg });
    }
  },
};
