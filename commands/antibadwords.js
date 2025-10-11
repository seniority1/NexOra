// commands/antibadwords.js
import { isAdmin } from "../utils/isAdmin.js";
import { getSetting, setSetting } from "../utils/settings.js";

export default {
  name: "antibadwords",
  description: "Toggle Anti-Badwords Filter (Admin only)",
  async execute(sock, msg, args) {
    const groupId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Check group
    if (!groupId.endsWith("@g.us")) {
      await sock.sendMessage(groupId, { text: "⚠️ This command only works in groups." }, { quoted: msg });
      return;
    }

    // ✅ Check if executor is admin
    const admin = await isAdmin(sock, groupId, sender);
    if (!admin) {
      await sock.sendMessage(groupId, { text: "❌ Only *group admins* can use this command." }, { quoted: msg });
      return;
    }

    const action = args[0]?.toLowerCase();

    if (action === "on") {
      setSetting(groupId, { antibadwords: true });
      await sock.sendMessage(groupId, { text: "🚫 Anti-Badwords filter *ENABLED* ✅" }, { quoted: msg });
    } else if (action === "off") {
      setSetting(groupId, { antibadwords: false });
      await sock.sendMessage(groupId, { text: "🚫 Anti-Badwords filter *DISABLED* ❌" }, { quoted: msg });
    } else {
      const state = getSetting(groupId).antibadwords ? "ON ✅" : "OFF ❌";
      await sock.sendMessage(groupId, { text: `📌 Anti-Badwords is currently *${state}*` }, { quoted: msg });
    }
  },
};
