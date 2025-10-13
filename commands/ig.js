import axios from "axios";
import fs from "fs";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  name: "ig",
  description: "Download Instagram reels, videos, or photos with animated NexOra watermark",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;

    if (!args[0]) {
      await sock.sendMessage(from, { text: "⚠️ Please provide a valid Instagram link." });
      return;
    }

    const url = args[0];
    await sock.sendMessage(from, { text: "⏳ Fetching Instagram media..." });

    try {
      // ✅ Use a public Instagram downloader API
      const res = await axios.get(`https://api.akuari.my.id/downloader/ig?link=${encodeURIComponent(url)}`);
      const data = res.data;

      if (!data || !data.medias || data.medias.length === 0) {
        await sock.sendMessage(from, { text: "❌ No downloadable media found. Try another link." });
        return;
      }

      for (const media of data.medias) {
        if (media.extension === "mp4") {
          // 🎥 Handle video
          const inputFile = path.join(__dirname, `temp_ig_${Date.now()}.mp4`);
          const outputFile = path.join(__dirname, `temp_ig_final_${Date.now()}.mp4`);

          // Download video
          const writer = fs.createWriteStream(inputFile);
          const stream = await axios({ url: media.url, method: "GET", responseType: "stream" });
          stream.data.pipe(writer);
          await new Promise((res, rej) => {
            writer.on("finish", res);
            writer.on("error", rej);
          });

          // 🖋️ Add animated watermark (fade in/out every few seconds)
          const ffmpegCmd = `
            ffmpeg -i "${inputFile}" -vf "
              drawtext=text='Powered by NexOra':
              fontcolor=white@0.6:
              fontsize=30:
              shadowcolor=black@0.4:
              shadowx=3:
              shadowy=3:
              x=(w-text_w)-25:
              y=(h-text_h)-25:
              enable='between(mod(t,6),0,3)'
            " -codec:a copy -y "${outputFile}"
          `;

          await new Promise((resolve, reject) => {
            exec(ffmpegCmd, (error) => (error ? reject(error) : resolve()));
          });

          // 📤 Send watermarked video
          await sock.sendMessage(from, {
            video: { url: outputFile },
            caption: `🎬 ${data.title || "Instagram Video"}`
          });

          fs.unlinkSync(inputFile);
          fs.unlinkSync(outputFile);
        } else if (media.url.endsWith(".jpg") || media.url.endsWith(".png")) {
          // 🖼️ Handle image
          await sock.sendMessage(from, {
            image: { url: media.url },
            caption: `🖼️ ${data.title || "Instagram Photo"}\n\n✨━━━『 𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗯𝘆 𝗡𝗲𝘅𝗢𝗿𝗮 』━━━✨`
          });
        }
      }
    } catch (err) {
      console.error("❌ Instagram download error:", err.message);
      await sock.sendMessage(from, {
        text: "❌ Failed to download Instagram media. Please try again later."
      });
    }
  }
};
