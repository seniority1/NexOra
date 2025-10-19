import { isOwner } from "../utils/isOwner.js";
import { getMode, setMode } from "../utils/mode.js";

export default {
  name: "mode",
  description: "Switch between public or private bot mode (owner only)",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    // ✅ Only owners can use it
    if (!isOwner(sender)) {
      return sock.sendMessage(from, { text: "❌ Only bot owners can change mode." });
    }

    const newMode = args[0]?.toLowerCase();
    if (!newMode) {
      const current = getMode();
      return sock.sendMessage(from, { text: `📢 *Current Mode:* ${current.toUpperCase()}` });
    }

    if (!["public", "private"].includes(newMode)) {
      return sock.sendMessage(from, { text: "⚠️ Usage: .mode public | .mode private" });
    }

    setMode(newMode);
    await sock.sendMessage(from, {
      text: `✅ Mode changed to *${newMode.toUpperCase()}*.\n${
        newMode === "private"
          ? "🔒 Only owners can use bot commands now."
          : "🌍 Everyone can use bot commands."
      }`,
    });
  },
};
