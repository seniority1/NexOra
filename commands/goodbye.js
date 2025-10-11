import { isAdmin } from "../utils/isAdmin.js";
import { getSetting, setSetting } from "../utils/settings.js";

export default {
  name: "goodbye",
  description: "Toggle Goodbye Messages (Admin only)",
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
      setSetting(groupId, { goodbye: true });
      await sock.sendMessage(groupId, { text: "👋 Goodbye Messages *ENABLED* ✅" }, { quoted: msg });
    } else if (action === "off") {
      setSetting(groupId, { goodbye: false });
      await sock.sendMessage(groupId, { text: "👋 Goodbye Messages *DISABLED* ❌" }, { quoted: msg });
    } else {
      const state = getSetting(groupId).goodbye ? "ON ✅" : "OFF ❌";
      await sock.sendMessage(groupId, { text: `📌 Goodbye Messages are currently *${state}*` }, { quoted: msg });
    }
  },
};
