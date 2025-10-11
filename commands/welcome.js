import { getSetting, setSetting } from "../utils/settings.js";

export default {
  name: "welcome",
  description: "Toggle Welcome Messages (Admin only)",
  async execute(sock, msg, args) {
    const group = msg.key.remoteJid;
    if (!group.endsWith("@g.us")) return;

    const action = args[0];
    if (action === "on") {
      setSetting(group, { welcome: true });
      await sock.sendMessage(group, { text: "👋 Welcome messages *ENABLED*." }, { quoted: msg });
    } else if (action === "off") {
      setSetting(group, { welcome: false });
      await sock.sendMessage(group, { text: "👋 Welcome messages *DISABLED*." }, { quoted: msg });
    } else {
      const state = getSetting(group).welcome ? "ON ✅" : "OFF ❌";
      await sock.sendMessage(group, { text: `📌 Welcome is currently *${state}*` }, { quoted: msg });
    }
  },
};
