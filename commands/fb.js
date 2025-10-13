import axios from "axios";
import fs from "fs";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "fb",
  description: "Download Facebook videos with NexOra watermark",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;

    if (!args[0]) {
      await sock.sendMessage(from, { text: "⚠️ Please provide a Facebook video link." });
      return;
    }

    const url = args[0];
    await sock.sendMessage(from, { text: "⏳ Downloading Facebook video..." });

    try {
      // ✅ Get video info from API
      const res = await axios.get(`https://api.akuari.my.id/downloader/fb?link=${encodeURIComponent(url)}`);
      const data = res.data;

      if (!data || !data.medias || data.medias.length === 0) {
        await sock.sendMessage(from, { text: "❌ No downloadable video found. Try another link." });
        return;
      }

      const videoUrl = data.medias.find(v => v.extension === "mp4")?.url || data.medias[0].url;

      // 📥 Download the video
      const inputFile = path.join(__dirname, `temp_fb_${Date.now()}.mp4`);
      const outputFile = path.join(__dirname, `temp_fb_final_${Date.now()}.mp4`);
      const writer = fs.createWriteStream(inputFile);
      const videoStream = await axios({ url: videoUrl, method: "GET", responseType: "stream" });
      videoStream.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      // 🖋️ Add blurred “Powered by NexOra” watermark using FFmpeg
      await new Promise((resolve, reject) => {
        const ffmpegCmd = `ffmpeg -i "${inputFile}" -vf "drawtext=text='Powered by NexOra':x=(w-text_w)-20:y=(h-text_h)-20:fontcolor=white@0.5:fontsize=28:shadowcolor=black@0.3:shadowx=3:shadowy=3" -codec:a copy "${outputFile}" -y`;
        exec(ffmpegCmd, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      // 📤 Send the watermarked video
      await sock.sendMessage(from, {
        video: { url: outputFile },
        caption: `🎥 ${data.title || "Facebook Video"}`
      });

      // 🧹 Clean up temp files
      fs.unlinkSync(inputFile);
      fs.unlinkSync(outputFile);
    } catch (err) {
      console.error("❌ Facebook download error:", err.message);
      await sock.sendMessage(from, { text: "❌ Failed to download Facebook video. Please try again later." });
    }
  }
};
