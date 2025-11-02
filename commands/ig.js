import axios from "axios";
import fs from "fs";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "ig",
  description: "Download Instagram reels, videos, or images with NexOra watermark",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;

    if (!args[0]) {
      await sock.sendMessage(from, { text: "⚠️ Please provide a valid Instagram link." });
      return;
    }

    const url = args[0];
    await sock.sendMessage(from, { text: "⏳ Fetching Instagram media..." });

    try {
      // ✅ Try main API
      let data;
      try {
        const res = await axios.get(`https://api.akuari.my.id/downloader/ig?link=${encodeURIComponent(url)}`);
        data = res.data;
      } catch {
        // 🔄 Fallback API (vercel)
        const backup = await axios.get(`https://snapinsta.vercel.app/api?url=${encodeURIComponent(url)}`);
        data = backup.data;
      }

      // 🧩 Extract URLs
      const mediaUrls = [];
      if (data?.medias) {
        mediaUrls.push(...data.medias.map((m) => m.url));
      } else if (data?.url) {
        mediaUrls.push(data.url);
      } else if (data?.result) {
        mediaUrls.push(...data.result.map((r) => r.url));
      }

      if (mediaUrls.length === 0) {
        await sock.sendMessage(from, { text: "❌ No downloadable media found. Try another link." });
        return;
      }

      // 🖼️ Handle first media only for now
      const mediaUrl = mediaUrls[0];
      const isVideo = mediaUrl.includes(".mp4");

      if (isVideo) {
        const inputFile = path.join(__dirname, `temp_ig_${Date.now()}.mp4`);
        const outputFile = path.join(__dirname, `temp_ig_final_${Date.now()}.mp4`);

        // Download video
        const video = await axios({ url: mediaUrl, method: "GET", responseType: "stream" });
        const writer = fs.createWriteStream(inputFile);
        video.data.pipe(writer);
        await new Promise((res, rej) => {
          writer.on("finish", res);
          writer.on("error", rej);
        });

        // 🖋️ Simple watermark
        await new Promise((resolve, reject) => {
          const ffmpegCmd = `ffmpeg -i "${inputFile}" -vf "drawtext=text='Powered by NexOra':fontcolor=white@0.5:fontsize=28:x=(w-text_w)-20:y=(h-text_h)-20:shadowcolor=black@0.3:shadowx=3:shadowy=3" -codec:a copy "${outputFile}" -y`;
          exec(ffmpegCmd, (error) => (error ? reject(error) : resolve()));
        });

        await sock.sendMessage(from, {
          video: { url: outputFile },
          caption: "🎬 Instagram Video\n✨ Powered by NexOra"
        });

        fs.unlinkSync(inputFile);
        fs.unlinkSync(outputFile);
      } else {
        await sock.sendMessage(from, {
          image: { url: mediaUrl },
          caption: "🖼️ Instagram Image\n✨ Powered by NexOra"
        });
      }
    } catch (err) {
      console.error("❌ Instagram download error:", err.message);
      await sock.sendMessage(from, { text: "❌ Failed to download Instagram media. Please try again later." });
    }
  },
};
