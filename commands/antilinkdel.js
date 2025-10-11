import { isAdmin } from "../utils/isAdmin.js";
import { getSetting, setSetting } from "../utils/settings.js";

export default {
  name: "antilinkdel",
  description: "Toggle Anti-Link (Delete) (Admin only)",
  async execute(sock, msg, args) {
    const groupId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    if (!groupId.endsWith("@g.us")) {
      await sock.sendMessage(groupId, { text: "⚠️ This command only works in groups." }, { quoted: msg });
      return;
    }

    const admin = await isAdmin(sock, groupId, sender);
    if (!admin) {
      await sock.sendMessage(groupId, { text: "❌ Only *group admins* can use this command." }, { quoted: msg });
      return;
    }

    const action = args[0]?.toLowerCase();
    if (action === "on") {
      setSetting(groupId, { antilinkdel: true });
      await sock.sendMessage(groupId, { text: "🔗 Anti-Link Delete *ENABLED* ✅" }, { quoted: msg });
    } else if (action === "off") {
      setSetting(groupId, { antilinkdel: false });
      await sock.sendMessage(groupId, { text: "🔗 Anti-Link Delete *DISABLED* ❌" }, { quoted: msg });
    } else {
      const state = getSetting(groupId).antilinkdel ? "ON ✅" : "OFF ❌";
      await sock.sendMessage(groupId, { text: `📌 Anti-Link Delete is currently *${state}*` }, { quoted: msg });
    }
  },
};
