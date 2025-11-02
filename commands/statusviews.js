import { isOwner } from "../utils/isOwner.js";

export default {
  name: "statusviews",
  description: "Check who viewed your recent status (Owner only)",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const botName = "NexOra";
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Owner check
    if (!isOwner(sender)) {
      return sock.sendMessage(from, { text: "❌ Only owner can use this command!" }, { quoted: msg });
    }

    try {
      const stories = await sock.fetchStatusUpdates();
      if (!stories || stories.length === 0) {
        return sock.sendMessage(from, { text: "📭 No recent status or views yet." }, { quoted: msg });
      }

      const last = stories[stories.length - 1];
      const viewers = last.participants || [];
      const count = viewers.length;

      let text = `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
👀 *Status Views Report*

📊 Total views: *${count}*
${count > 0 ? "\n" + viewers.map((v, i) => `${i + 1}. @${v.split("@")[0]}`).join("\n") : ""}
┗━━━━━━━━━━━━━━━━━━━━┛
      `.trim();

      await sock.sendMessage(from, { text, mentions: viewers }, { quoted: msg });
    } catch (err) {
      console.error("statusviews error:", err);
      await sock.sendMessage(from, { text: "⚠️ Failed to fetch status views." }, { quoted: msg });
    }
  },
};
