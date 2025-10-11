import { getSetting, setSetting } from "../utils/settings.js";

export default {
  name: "antilinkkick",
  description: "Toggle Anti-Link Kick (Admin only)",
  async execute(sock, msg, args) {
    const group = msg.key.remoteJid;
    if (!group.endsWith("@g.us")) return;

    const action = args[0];
    if (action === "on") {
      setSetting(group, { antilinkkick: true });
      await sock.sendMessage(group, { text: "🥾 Anti-Link Kick has been *ENABLED*." }, { quoted: msg });
    } else if (action === "off") {
      setSetting(group, { antilinkkick: false });
      await sock.sendMessage(group, { text: "🥾 Anti-Link Kick has been *DISABLED*." }, { quoted: msg });
    } else {
      const state = getSetting(group).antilinkkick ? "ON ✅" : "OFF ❌";
      await sock.sendMessage(group, { text: `📌 Anti-Link Kick is currently *${state}*` }, { quoted: msg });
    }
  },
};
