// commands/antidelete.js
import { getSetting, setSetting } from "../utils/settings.js";

export default {
  name: "antidelete",
  description: "Toggle Anti-Delete (Admin only)",
  async execute(sock, msg, args) {
    const group = msg.key.remoteJid;
    if (!group.endsWith("@g.us")) return;

    const action = args[0];
    if (action === "on") {
      setSetting(group, { antidelete: true });
      await sock.sendMessage(group, { text: "🛡️ Anti-Delete has been *ENABLED*. Deleted messages will be recovered." }, { quoted: msg });
    } else if (action === "off") {
      setSetting(group, { antidelete: false });
      await sock.sendMessage(group, { text: "🛡️ Anti-Delete has been *DISABLED*." }, { quoted: msg });
    } else {
      const state = getSetting(group).antidelete ? "ON ✅" : "OFF ❌";
      await sock.sendMessage(group, { text: `📌 Anti-Delete is currently *${state}*` }, { quoted: msg });
    }
  },
};
