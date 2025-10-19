// commands/mode.js
import { setMode, getMode } from "../utils/mode.js";

export default {
  name: "mode",
  description: "Switch bot mode between public/private",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const mode = args[0]?.toLowerCase();

    if (!mode) {
      const current = getMode();
      return sock.sendMessage(from, { text: `🟢 Current mode: *${current.toUpperCase()}*` });
    }

    if (mode !== "public" && mode !== "private") {
      return sock.sendMessage(from, { text: "⚙️ Use: .mode public OR .mode private" });
    }

    setMode(mode);
    await sock.sendMessage(from, {
      text: mode === "public"
        ? "🟢 Bot is now in *Public mode successfully*."
        : "🔒 Bot is now in *Private mode*.",
    });
  },
};
