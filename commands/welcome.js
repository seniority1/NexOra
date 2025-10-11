import { isAdmin } from "../utils/isAdmin.js";
import { getSetting, setSetting } from "../utils/settings.js";

export default {
  name: "welcome",
  description: "Toggle Welcome Messages (Admin only)",
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
      setSetting(groupId, { welcome: true });
      await sock.sendMessage(groupId, { text: "👋 Welcome Messages *ENABLED* ✅" }, { quoted: msg });
    } else if (action === "off") {
      setSetting(groupId, { welcome: false });
      await sock.sendMessage(groupId, { text: "👋 Welcome Messages *DISABLED* ❌" }, { quoted: msg });
    } else {
      const state = getSetting(groupId).welcome ? "ON ✅" : "OFF ❌";
      await sock.sendMessage(groupId, { text: `📌 Welcome Messages are currently *${state}*` }, { quoted: msg });
    }
  },
};
