import { isOwner } from "../utils/isOwner.js";

export default {
  name: "setbio",
  description: "Change bot's WhatsApp bio (Owner only)",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const botName = "NexOra";
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Owner check
    if (!isOwner(sender)) {
      return sock.sendMessage(from, { text: "❌ Only owner can use this command!" }, { quoted: msg });
    }

    const newBio = args.join(" ");
    if (!newBio) {
      return sock.sendMessage(
        from,
        {
          text: `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
✍️ *Usage:*  *.setbio This is my new bot bio*
┗━━━━━━━━━━━━━━━━━━━━┛
          `.trim(),
        },
        { quoted: msg }
      );
    }

    try {
      await sock.updateProfileStatus(newBio);
      await sock.sendMessage(
        from,
        {
          text: `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
✅ *Bio updated successfully!*
📄 New Bio: *${newBio}*
┗━━━━━━━━━━━━━━━━━━━━┛
          `.trim(),
        },
        { quoted: msg }
      );
    } catch (err) {
      console.error("SetBio error:", err);
      await sock.sendMessage(from, { text: "❌ Failed to update bio." }, { quoted: msg });
    }
  },
};
