import axios from "axios";
import fs from "fs";
import { exec } from "child_process";
import path from "path";

export default {
  name: "tiktok",
  description: "Download TikTok videos with watermark",
  async execute(sock, msg, args) {
    if (!args[0]) {
      await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Please provide a TikTok link." });
      return;
    }

    const url = args[0];

    const captionTemplate = `🎬 *{title}*\n\n━━━━━━━━━━━━━━━\n⚡ 𝙋𝙤𝙬𝙚𝙧𝙚𝙙 𝙗𝙮 𝙉𝙚𝙭𝙊𝙧𝙖 ⚡\n━━━━━━━━━━━━━━━`;

    try {
      const res = await axios.get(`https://tikwm.com/api/?url=${url}`);
      const data = res.data.data;
      const videoUrl = data.play;
      const caption = captionTemplate.replace("{title}", data.title || "TikTok Video");

      // 📥 Download the video temporarily
      const inputPath = path.join(process.cwd(), `tiktok_${Date.now()}.mp4`);
      const outputPath = path.join(process.cwd(), `tiktok_wm_${Date.now()}.mp4`);

      const videoStream = await axios.get(videoUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(inputPath, Buffer.from(videoStream.data));

      // 📝 Add watermark using ffmpeg
      const watermarkText = "NexOra Bot";
      const ffmpegCmd = `ffmpeg -i "${inputPath}" -vf "drawtext=text='${watermarkText}':fontcolor=white:fontsize=24:x=w-tw-10:y=h-th-10:box=1:boxcolor=black@0.5:boxborderw=5" -codec:a copy "${outputPath}" -y`;

      await new Promise((resolve, reject) => {
        exec(ffmpegCmd, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });

      // 📤 Send processed video
      await sock.sendMessage(msg.key.remoteJid, {
        video: { url: outputPath },
        caption,
      });

      // 🧹 Clean up
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);

    } catch (err) {
      console.error("❌ TikTok download error:", err);
      await sock.sendMessage(msg.key.remoteJid, {
        text: "❌ Failed to download TikTok video.",
      });
    }
  }
};
