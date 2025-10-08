export default {
  name: "ipinfo",
  description: "Get information about an IP address",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const botName = "NexOra";
    const ip = args[0];

    if (!ip) {
      return sock.sendMessage(from, { text: "🛰️ Usage: `.ipinfo <ip>`" }, { quoted: msg });
    }

    try {
      const res = await fetch(`https://ipinfo.io/${ip}/json`);
      const data = await res.json();

      const text = `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
          🛰️ *IP INFO* 🛰️

🧭 *IP:* ${data.ip || ip}  
🏙️ *City:* ${data.city || "N/A"}  
🌍 *Region:* ${data.region || "N/A"}  
🇨🇺 *Country:* ${data.country || "N/A"}  
📍 *Location:* ${data.loc || "N/A"}  
🏢 *Org:* ${data.org || "N/A"}

┗━━━━━━━━━━━━━━━━━━━━┛
      `;
      await sock.sendMessage(from, { text: text.trim() }, { quoted: msg });
    } catch (err) {
      await sock.sendMessage(from, { text: "⚠️ Failed to get IP info." }, { quoted: msg });
    }
  },
};
