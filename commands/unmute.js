import { isAdmin } from "../utils/isAdmin.js";

export default {
  name: "unmute",
  description: "Unmute the group (admins only)",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const botName = "NexOra";
    const sender = msg.key.participant || msg.key.remoteJid;

    if (!from.endsWith("@g.us")) {
      return sock.sendMessage(from, { text: "⚠️ This command only works inside groups." }, { quoted: msg });
    }

    if (!(await isAdmin(sock, from, sender))) {
      return sock.sendMessage(from, { text: "❌ Only *group admins* can use this command." }, { quoted: msg });
    }

    try {
      await sock.groupSettingUpdate(from, "not_announcement"); // ✅ Everyone can send
      const text = `
┏━━🔊 *${botName.toUpperCase()} BOT* ━━┓
        ✅ *GROUP UNMUTED* ✅

Everyone can now send messages again.  
Let's keep the chat clean 🧹✨

┗━━━━━━━━━━━━━━━━━━━━┛
      `;
      await sock.sendMessage(from, { text: text.trim() }, { quoted: msg });
    } catch (err) {
      console.error("❌ Unmute error:", err);
      await sock.sendMessage(from, { text: "❌ Failed to unmute the group." }, { quoted: msg });
    }
  },
};
