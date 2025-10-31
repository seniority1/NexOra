// commands/setclosetime.js
import { isAdmin } from "../utils/isAdmin.js";

export default {
  name: "setclosetime",
  description: "Set group auto-close (and optional reopen) timer (Admin only)",
  async execute(sock, msg, args) {
    const groupId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Check group
    if (!groupId.endsWith("@g.us")) {
      await sock.sendMessage(groupId, { text: "⚠️ This command only works in groups." }, { quoted: msg });
      return;
    }

    // ✅ Check admin
    const admin = await isAdmin(sock, groupId, sender);
    if (!admin) {
      await sock.sendMessage(groupId, { text: "❌ Only *group admins* can use this command." }, { quoted: msg });
      return;
    }

    // ✅ Example usage
    if (args.length === 0) {
      await sock.sendMessage(
        groupId,
        {
          text: `⏰ Usage:
*.setclosetime <closeTime> [open <openTime>]*

Examples:
• .setclosetime 10m
• .setclosetime 30s open 10m
• .setclosetime 1h open 2h`
        },
        { quoted: msg }
      );
      return;
    }

    // ✅ Parse arguments
    const closeInput = args[0];
    const openIndex = args.findIndex(a => a.toLowerCase() === "open");
    const openInput = openIndex !== -1 ? args[openIndex + 1] : null;

    const closeTime = parseTime(closeInput);
    const openTime = openInput ? parseTime(openInput) : null;

    if (!closeTime) {
      await sock.sendMessage(groupId, { text: "⚠️ Invalid close time format. Use like `10s`, `5m`, or `1h`." }, { quoted: msg });
      return;
    }
    if (openIndex !== -1 && !openTime) {
      await sock.sendMessage(groupId, { text: "⚠️ Invalid open time format. Use like `10s`, `5m`, or `1h`." }, { quoted: msg });
      return;
    }

    // ✅ Confirm action
    let confirmMsg = `✅ Group will be *closed* in ${closeInput}`;
    if (openTime) confirmMsg += ` and *reopened* after ${openInput}`;
    await sock.sendMessage(groupId, { text: confirmMsg + " 🔒" }, { quoted: msg });

    // ⏳ Close group after timer
    setTimeout(async () => {
      try {
        await sock.groupSettingUpdate(groupId, "announcement");
        await sock.sendMessage(groupId, { text: "🚫 Group has been *closed automatically* 🔒" });

        // If reopen time provided
        if (openTime) {
          setTimeout(async () => {
            try {
              await sock.groupSettingUpdate(groupId, "not_announcement");
              await sock.sendMessage(groupId, { text: "✅ Group has been *reopened automatically* 🔓" });
            } catch (err) {
              console.error("Error reopening group:", err);
            }
          }, openTime);
        }
      } catch (err) {
        console.error("Error closing group:", err);
      }
    }, closeTime);
  },
};

// 🧮 Helper — convert time string (10s/5m/1h) to ms
function parseTime(str) {
  const match = str.match(/^(\d+)(s|m|h)$/i);
  if (!match) return null;

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  if (unit === "s") return value * 1000;
  if (unit === "m") return value * 60 * 1000;
  if (unit === "h") return value * 60 * 60 * 1000;
  return null;
}
