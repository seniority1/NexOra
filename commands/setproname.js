import { isOwner } from "../utils/isOwner.js";

export default {
  name: "setproname",
  description: "Change bot's WhatsApp profile name (Owner only)",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const botName = "NexOra";
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Owner check
    if (!isOwner(sender)) {
      return sock.sendMessage(from, { text: "❌ Only owner can use this command!" }, { quoted: msg });
    }

    const newName = args.join(" ");
    if (!newName) {
      return sock.sendMessage(
        from,
        {
          text: `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
✍️ *Usage:*  *.setproname New Bot Name*
┗━━━━━━━━━━━━━━━━━━━━┛
          `.trim(),
        },
        { quoted: msg }
      );
    }

    try {
      await sock.updateProfileName(newName);
      await sock.sendMessage(
        from,
        {
          text: `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
✅ *Profile name updated!*
📝 New Name: *${newName}*
┗━━━━━━━━━━━━━━━━━━━━┛
          `.trim(),
        },
        { quoted: msg }
      );
    } catch (err) {
      console.error("SetProName error:", err);
      await sock.sendMessage(from, { text: "❌ Failed to update profile name." }, { quoted: msg });
    }
  },
};
