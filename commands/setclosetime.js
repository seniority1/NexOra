// commands/setclosetime.js
import { isAdmin } from "../utils/isAdmin.js";

export default {
  name: "setclosetime",
  description: "Set group close timer (Admin only)",
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

    // ✅ Parse time argument
    const timeInput = args[0];
    if (!timeInput) {
      await sock.sendMessage(
        groupId,
        { text: "⏰ Usage: *.setclosetime <number><s/m/h>*\n\nExample:\n.setclosetime 30s\n.setclosetime 10m\n.setclosetime 1h" },
        { quoted: msg }
      );
      return;
    }

    // ✅ Convert time to milliseconds
    const time = parseTime(timeInput);
    if (!time) {
      await sock.sendMessage(groupId, { text: "⚠️ Invalid time format. Use like `30s`, `10m`, or `1h`." }, { quoted: msg });
      return;
    }

    // ✅ Acknowledge
    await sock.sendMessage(
      groupId,
      { text: `✅ Group will be *closed* in ${timeInput} 🔒` },
      { quoted: msg }
    );

    // ⏳ Wait and then close
    setTimeout(async () => {
      try {
        await sock.groupSettingUpdate(groupId, "announcement"); // close group
        await sock.sendMessage(groupId, { text: "🚫 Group has been *closed* automatically by timer." });
      } catch (err) {
        console.error("Error closing group:", err);
      }
    }, time);
  },
};

// Helper: convert time input like 10s, 5m, 1h to milliseconds
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
