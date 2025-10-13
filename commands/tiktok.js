import axios from "axios";

export default {
  name: "tiktok",
  description: "Download TikTok videos",
  async execute(sock, msg, args) {
    if (!args[0]) {
      await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Please provide a TikTok link." });
      return;
    }

    const url = args[0];
    try {
      const res = await axios.get(`https://tikwm.com/api/?url=${url}`);
      const data = res.data.data;

      await sock.sendMessage(msg.key.remoteJid, {
        video: { url: data.play },
        caption: `🎬 ${data.title || "TikTok Video"}\n\n🤖 Powered by *NexOra*`
      });
    } catch (err) {
      console.error("❌ TikTok download error:", err.message);
      await sock.sendMessage(msg.key.remoteJid, { text: "❌ Failed to download TikTok video." });
    }
  }
};
