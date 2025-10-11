import { getSetting, setSetting } from "../utils/settings.js";

export default {
  name: "goodbye",
  description: "Toggle Goodbye Messages (Admin only)",
  async execute(sock, msg, args) {
    const group = msg.key.remoteJid;
    if (!group.endsWith("@g.us")) return;

    const action = args[0];
    if (action === "on") {
      setSetting(group, { goodbye: true });
      await sock.sendMessage(group, { text: "👋 Goodbye messages *ENABLED*." }, { quoted: msg });
    } else if (action === "off") {
      setSetting(group, { goodbye: false });
      await sock.sendMessage(group, { text: "👋 Goodbye messages *DISABLED*." }, { quoted: msg });
    } else {
      const state = getSetting(group).goodbye ? "ON ✅" : "OFF ❌";
      await sock.sendMessage(group, { text: `📌 Goodbye is currently *${state}*` }, { quoted: msg });
    }
  },
};
