import { isOwner } from "../utils/isOwner.js";
import { autoBotConfig, toggleAutoBot } from "../utils/autobot.js";

export default {
  name: "autotoggle",
  description: "Toggle auto features (Owner only)",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const botName = "NexOra";

    // ✅ Owner check
    if (!isOwner(sender)) {
      return sock.sendMessage(from, { text: "❌ Only owner can use this command!" }, { quoted: msg });
    }

    const feature = args[0]?.toLowerCase();
    const action = args[1]?.toLowerCase();

    const featureMap = {
      autotyping: "autoTyping",
      autorecord: "autoRecording",
      autoread: "autoRead",
      autoviewstat: "autoViewStatus",
      autoreact: "autoReact",
    };

    // 📌 Show all current states if no args
    if (!feature || !action) {
      const statusText = `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
⚙️ *Auto Feature Settings*

• autotyping: ${autoBotConfig.autoTyping ? "✅ ON" : "❌ OFF"}
• autorecord: ${autoBotConfig.autoRecording ? "✅ ON" : "❌ OFF"}
• autoread: ${autoBotConfig.autoRead ? "✅ ON" : "❌ OFF"}
• autoviewstat: ${autoBotConfig.autoViewStatus ? "✅ ON" : "❌ OFF"}
• autoreact: ${autoBotConfig.autoReact ? "✅ ON" : "❌ OFF"}

📌 *Usage:*  
.autotoggle <feature> on/off
┗━━━━━━━━━━━━━━━━━━━━┛
      `.trim();

      return sock.sendMessage(from, { text: statusText }, { quoted: msg });
    }

    const key = featureMap[feature];
    if (!key) {
      return sock.sendMessage(from, { text: "❌ Unknown feature." }, { quoted: msg });
    }

    const value = action === "on";
    toggleAutoBot(key, value);

    await sock.sendMessage(
      from,
      {
        text: `✅ *${feature}* has been turned *${value ? "ON" : "OFF"}*.`,
      },
      { quoted: msg }
    );
  },
};
