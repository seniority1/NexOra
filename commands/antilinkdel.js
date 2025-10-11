import { getSetting, setSetting } from "../utils/settings.js";

export default {
  name: "antilinkdel",
  description: "Toggle Anti-Link Delete (Admin only)",
  async execute(sock, msg, args) {
    const group = msg.key.remoteJid;
    if (!group.endsWith("@g.us")) return;

    const action = args[0];
    if (action === "on") {
      setSetting(group, { antilinkdel: true });
      await sock.sendMessage(group, { text: "🧹 Anti-Link Delete has been *ENABLED*." }, { quoted: msg });
    } else if (action === "off") {
      setSetting(group, { antilinkdel: false });
      await sock.sendMessage(group, { text: "🧹 Anti-Link Delete has been *DISABLED*." }, { quoted: msg });
    } else {
      const state = getSetting(group).antilinkdel ? "ON ✅" : "OFF ❌";
      await sock.sendMessage(group, { text: `📌 Anti-Link Delete is currently *${state}*` }, { quoted: msg });
    }
  },
};
