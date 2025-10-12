import axios from "axios";

export default {
  name: "tiktok",
  description: "🎬 Download TikTok videos without watermark",
  category: "downloader",

  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const url = args[0];

    if (!url) {
      await sock.sendMessage(from, { text: "❌ Please provide a TikTok video link." });
      return;
    }

    try {
      const api = `https://api.tiklydown.me/api/download?url=${encodeURIComponent(url)}`;
      const { data } = await axios.get(api);

      if (!data?.video?.noWatermark) {
        throw new Error("No video found");
      }

      await sock.sendMessage(from, {
        video: { url: data.video.noWatermark },
        caption: "✅ Downloaded TikTok video successfully!",
      });
    } catch (err) {
      console.error("❌ TikTok download error:", err.message);
      await sock.sendMessage(from, { text: "⚠️ Could not fetch TikTok video." });
    }
  },
};
