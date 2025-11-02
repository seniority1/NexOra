// commands/fb.js
import axios from "axios";
import fs from "fs";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "fb",
  description: "Download Facebook or Reels videos with NexOra watermark",

  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const link = args[0];

    if (!link) {
      return sock.sendMessage(from, {
        text: "⚠️ Please provide a valid Facebook or Reels video link.\n\nExample:\n.fb https://fb.watch/example\n.fb https://www.facebook.com/reel/123456789",
      });
    }

    await sock.sendMessage(from, { text: "⏳ Fetching Facebook/Reels video..." });

    try {
      // 🔍 Detect reel/watch/post and clean URL
      const cleanLink = link.replace(/m\.facebook|www\.facebook/, "facebook").trim();

      // ✅ Try Widipe API first
      let videoUrl = null;
      let title = "Facebook Video";

      const res = await axios.get(`https://widipe.com/download/fb?url=${encodeURIComponent(cleanLink)}`);
      const data = res.data;

      if (data?.result?.links && data.result.links.length > 0) {
        const best = data.result.links.find(v => v.quality === "HD") || data.result.links[0];
        videoUrl = best.url;
        title = data.result.title || "Facebook Video";
      }

      // 🔄 Fallback API (in case Widipe is down)
      if (!videoUrl) {
        const backup = await axios.get(`https://api.cafirexos.com/api/facebook?url=${encodeURIComponent(cleanLink)}`);
        if (backup?.data?.url) videoUrl = backup.data.url;
      }

      if (!videoUrl) {
        return sock.sendMessage(from, { text: "❌ No downloadable video found. Try another link." });
      }

      // 📥 Download video
      const tempIn = path.join(__dirname, `fb_in_${Date.now()}.mp4`);
      const tempOut = path.join(__dirname, `fb_out_${Date.now()}.mp4`);

      const writer = fs.createWriteStream(tempIn);
      const response = await axios({ url: videoUrl, method: "GET", responseType: "stream" });
      response.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      // 🖋️ Add watermark using FFmpeg
      await new Promise((resolve, reject) => {
        const cmd = `ffmpeg -i "${tempIn}" -vf "drawtext=text='Powered by NexOra':x=(w-text_w)-20:y=(h-text_h)-20:fontcolor=white@0.8:fontsize=28:shadowcolor=black@0.5:shadowx=2:shadowy=2" -codec:a copy "${tempOut}" -y`;
        exec(cmd, (error) => (error ? reject(error) : resolve()));
      });

      // 📤 Send video
      await sock.sendMessage(from, {
        video: { url: tempOut },
        caption: `🎥 ${title}\n\n💚 Downloaded by *NexOra Bot*`,
      });

      // 🧹 Cleanup
      fs.unlinkSync(tempIn);
      fs.unlinkSync(tempOut);
    } catch (err) {
      console.error("❌ Facebook/Reel download error:", err.message);
      await sock.sendMessage(from, { text: "⚠️ Failed to download video. Try again later." });
    }
  },
};
