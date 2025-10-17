import { isAdmin } from "../utils/isAdmin.js";
import { bannedUsers } from "./ban.js";

export default {
  name: "banlist",
  description: "Show all currently banned users and remaining time",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    if (!from.endsWith("@g.us")) {
      return sock.sendMessage(from, { text: "⚠️ This command only works inside groups." }, { quoted: msg });
    }

    if (!(await isAdmin(sock, from, sender))) {
      return sock.sendMessage(from, { text: "❌ Only *group admins* can use this command." }, { quoted: msg });
    }

    // 📝 Check if there are any banned users in this group
    const groupBans = bannedUsers[from];
    if (!groupBans || Object.keys(groupBans).length === 0) {
      return sock.sendMessage(from, { text: "✅ No users are currently banned in this group." }, { quoted: msg });
    }

    // 🧮 Build ban list message
    let text = `📋 *Ban List*\n\n`;
    const mentions = [];

    for (const [userId, info] of Object.entries(groupBans)) {
      const remaining = info.until - Date.now();
      if (remaining <= 0) {
        // auto-clean expired bans if any
        delete groupBans[userId];
        continue;
      }

      const timeLeft = formatDuration(remaining);
      mentions.push(userId);
      text += `- @${userId.split("@")[0]} → ⏳ ${timeLeft}\n`;
    }

    if (mentions.length === 0) {
      text = "✅ No users are currently banned in this group.";
    }

    await sock.sendMessage(
      from,
      {
        text,
        mentions,
      },
      { quoted: msg }
    );
  },
};

// Helper: pretty print duration
function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let result = "";
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0) result += `${minutes}m `;
  if (seconds > 0 || result === "") result += `${seconds}s`;
  return result.trim();
}
