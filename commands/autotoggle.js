import { isOwner } from "../utils/isOwner.js";
import { autoBotConfig, toggleAutoBot } from "../utils/autobot.js";

export default {
  name: "autotoggle",
  description: "Toggle all or individual auto features (Owner only)",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;
    const botName = "NexOra";

    // ✅ Owner-only check
    if (!isOwner(sender)) {
      return sock.sendMessage(from, { text: "❌ Only the bot owner can use this command." }, { quoted: msg });
    }

    const feature = args[0]?.toLowerCase();
    const action = args[1]?.toLowerCase();

    const featureMap = {
      autotyping: "autoTyping",
      autorecord: "autoRecording",
      autoread: "autoRead",
      autoviewstat: "autoViewStatus",
      autoreact: "autoReact",
      alwaysonline: "alwaysOnline",
    };

    // 🟢 MASTER SWITCH: .autotoggle on / off
    if (feature === "on" || feature === "off") {
      const value = feature === "on";
      const toggled = [];

      for (const [name, key] of Object.entries(featureMap)) {
        toggleAutoBot(key, value);
        toggled.push(`• ${name}: ${value ? "✅ ON" : "❌ OFF"}`);
      }

      const message = `
┏━━🤖 *${botName.toUpperCase()} AUTO SETTINGS UPDATED* ━━┓
${toggled.join("\n")}
┗━━━━━━━━━━━━━━━━━━━━┛

${value ? "✅ All features ENABLED." : "❌ All features DISABLED."}
      `.trim();

      return sock.sendMessage(from, { text: message }, { quoted: msg });
    }

    // 📋 Display all feature statuses if no args
    if (!feature || !action) {
      const status = `
┏━━🤖 *${botName.toUpperCase()} AUTO SETTINGS* ━━┓
⚙️ *Feature Status:*
• autotyping: ${autoBotConfig.autoTyping ? "✅ ON" : "❌ OFF"}
• autorecord: ${autoBotConfig.autoRecording ? "✅ ON" : "❌ OFF"}
• autoread: ${autoBotConfig.autoRead ? "✅ ON" : "❌ OFF"}
• autoviewstat: ${autoBotConfig.autoViewStatus ? "✅ ON" : "❌ OFF"}
• autoreact: ${autoBotConfig.autoReact ? "✅ ON" : "❌ OFF"}
• alwaysonline: ${autoBotConfig.alwaysOnline ? "✅ ON" : "❌ OFF"}

📌 *Usage:*  
.autotoggle <feature> on/off  
.autotoggle on → enable all  
.autotoggle off → disable all
┗━━━━━━━━━━━━━━━━━━━━┛
      `.trim();

      return sock.sendMessage(from, { text: status }, { quoted: msg });
    }

    // 🧩 Toggle individual feature
    const key = featureMap[feature];
    if (!key) {
      return sock.sendMessage(from, { text: "❌ Unknown feature." }, { quoted: msg });
    }

    const value = action === "on";
    toggleAutoBot(key, value);

    const singleMsg = `✅ *${feature}* has been turned *${value ? "ON" : "OFF"}*.`;
    await sock.sendMessage(from, { text: singleMsg }, { quoted: msg });
  },
};
