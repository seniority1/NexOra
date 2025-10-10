import { isAdmin } from "../utils/isAdmin.js";

export default {
  name: "mute",
  description: "Mute the group (admins only)",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const botName = "NexOra";
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Check group & admin
    if (!from.endsWith("@g.us")) {
      return sock.sendMessage(from, { text: "⚠️ This command only works inside groups." }, { quoted: msg });
    }

    if (!(await isAdmin(sock, from, sender))) {
      return sock.sendMessage(from, { text: "❌ Only *group admins* can use this command." }, { quoted: msg });
    }

    try {
      await sock.groupSettingUpdate(from, "announcement"); // ✅ Only admins can send
      const text = `
┏━━🔇 *${botName.toUpperCase()} BOT* ━━┓
       🚫 *GROUP MUTED BY ADMIN* 🚫

Only *admins* can send messages now.  
Use *.unmute* to restore chat.

┗━━━━━━━━━━━━━━━━━━━━┛
      `;
      await sock.sendMessage(from, { text: text.trim() }, { quoted: msg });
    } catch (err) {
      console.error("❌ Mute error:", err);
      await sock.sendMessage(from, { text: "❌ Failed to mute the group." }, { quoted: msg });
    }
  },
};
