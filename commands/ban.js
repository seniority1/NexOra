import { isAdmin } from "../utils/isAdmin.js";

// 📝 In-memory storage (replace with DB for persistence)
export const bannedUsers = {}; 
// Structure: bannedUsers[groupId][userId] = { until: timestamp, reason }

export default {
  name: "ban",
  description: "Temporarily ban a user from sending messages",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    if (!from.endsWith("@g.us")) {
      return sock.sendMessage(from, { text: "⚠️ This command only works inside groups." }, { quoted: msg });
    }

    if (!(await isAdmin(sock, from, sender))) {
      return sock.sendMessage(from, { text: "❌ Only *group admins* can use this command." }, { quoted: msg });
    }

    // ✅ Get mentioned or replied user
    let target;
    if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
      target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (msg.message?.extendedTextMessage?.contextInfo?.participant) {
      target = msg.message.extendedTextMessage.contextInfo.participant;
    } else {
      return sock.sendMessage(from, { text: "⚠️ Tag or reply to the user you want to *ban*." }, { quoted: msg });
    }

    // ⏳ Parse duration (e.g. 10s, 5m, 2h)
    const timeArg = args[1] || "5m"; // default: 5 minutes
    const durationMs = parseDuration(timeArg);
    if (!durationMs) {
      return sock.sendMessage(from, { text: "⚠️ Invalid time format. Use `10s`, `5m`, or `2h`." }, { quoted: msg });
    }

    const unbanTime = Date.now() + durationMs;

    // Store ban info
    if (!bannedUsers[from]) bannedUsers[from] = {};
    bannedUsers[from][target] = { until: unbanTime };

    const prettyTime = formatDuration(durationMs);
    await sock.sendMessage(
      from,
      {
        text: `🚫 @${target.split("@")[0]} has been *banned* for ${prettyTime}.`,
        mentions: [target],
      },
      { quoted: msg }
    );
  },
};

// 🧠 Listener to auto-delete banned users' messages
export function banListener(sock) {
  sock.ev.on("messages.upsert", async (upsert) => {
    for (const m of upsert.messages) {
      const groupId = m.key.remoteJid;
      const userId = m.key.participant || m.key.remoteJid;

      if (!groupId.endsWith("@g.us") || !bannedUsers[groupId]) continue;
      const banInfo = bannedUsers[groupId][userId];

      if (banInfo && Date.now() < banInfo.until) {
        // 🧹 Delete the message
        try {
          await sock.sendMessage(groupId, { delete: m.key });

          // Optional: warn the user
          await sock.sendMessage(groupId, {
            text: `⛔ @${userId.split("@")[0]}, you're currently *banned* from sending messages.`,
            mentions: [userId],
          });
        } catch (err) {
          console.error("Ban listener error:", err);
        }
      } else if (banInfo && Date.now() >= banInfo.until) {
        // ⏰ Auto-unban expired bans
        delete bannedUsers[groupId][userId];
      }
    }
  });
}

// 🧮 Helper: parse time (e.g. 10s, 5m, 2h)
function parseDuration(str) {
  const match = str.match(/^(\d+)(s|m|h)$/);
  if (!match) return null;
  const value = parseInt(match[1]);
  const unit = match[2];
  if (unit === "s") return value * 1000;
  if (unit === "m") return value * 60 * 1000;
  if (unit === "h") return value * 60 * 60 * 1000;
  return null;
}

// ⏳ Helper: pretty print duration
function formatDuration(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s} second(s)`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} minute(s)`;
  const h = Math.floor(m / 60);
  return `${h} hour(s)`;
}
