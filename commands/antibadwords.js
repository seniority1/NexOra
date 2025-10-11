import { getSetting, setSetting } from "../utils/settings.js";

export default {
  name: "antibadwords",
  description: "Toggle Anti-Badwords Filter (Admin only)",
  async execute(sock, msg, args) {
    const group = msg.key.remoteJid;
    if (!group.endsWith("@g.us")) return;

    const action = args[0];
    if (action === "on") {
      setSetting(group, { antibadwords: true });
      await sock.sendMessage(group, { text: "🚫 Anti-Badwords filter *ENABLED*." }, { quoted: msg });
    } else if (action === "off") {
      setSetting(group, { antibadwords: false });
      await sock.sendMessage(group, { text: "🚫 Anti-Badwords filter *DISABLED*." }, { quoted: msg });
    } else {
      const state = getSetting(group).antibadwords ? "ON ✅" : "OFF ❌";
      await sock.sendMessage(group, { text: `📌 Anti-Badwords is currently *${state}*` }, { quoted: msg });
    }
  },
};
