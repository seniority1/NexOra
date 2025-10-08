import { isOwner } from "../utils/isOwner.js";

export default {
  name: "unblock",
  description: "Unblock a user (Owner only)",
  async execute(sock, msg) {
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Check if sender is an owner
    if (!isOwner(sender)) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Only owner can use this command!",
      }, { quoted: msg });
      return;
    }

    // ✅ Extract target number or mention
    const body =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      "";
    const args = body.trim().split(/\s+/);
    args.shift(); // remove the ".unblock" part

    const mentioned =
      msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    const repliedUser =
      msg.message?.extendedTextMessage?.contextInfo?.participant;
    const numberArg = args[0];

    let target;

    if (mentioned) {
      target = mentioned;
    } else if (repliedUser) {
      target = repliedUser;
    } else if (numberArg) {
      target = numberArg.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
    }

    // ✅ If no target found → show usage message
    if (!target) {
      await sock.sendMessage(
        msg.key.remoteJid,
        {
          text: `⚙️ *Usage:*  
• Reply to a user's message:  *.unblock*  
• Mention a user:  *.unblock @user*  
• Use a number:  *.unblock 2348089821951*`,
        },
        { quoted: msg }
      );
      return;
    }

    // ✅ Attempt to unblock target
    try {
      await sock.updateBlockStatus(target, "unblock");
      await sock.sendMessage(
        msg.key.remoteJid,
        {
          text: `✅ Successfully unblocked @${target.split("@")[0]}`,
          mentions: [target],
        },
        { quoted: msg }
      );
    } catch (err) {
      console.error("Unblock error:", err);
      await sock.sendMessage(
        msg.key.remoteJid,
        {
          text: "❌ Failed to unblock user. Make sure the number is valid or not already unblocked.",
        },
        { quoted: msg }
      );
    }
  },
};
