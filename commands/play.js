import yts from "yt-search";
import { exec } from "child_process";
import fs from "fs";
import path from "path";

export default {
  name: "play",
  description: "Download and play songs from YouTube (MP3) using yt-dlp",

  async execute(sock, msg, args) {
    const chatId = msg.key.remoteJid;
    const searchQuery = args.join(" ").trim();

    if (!searchQuery) {
      await sock.sendMessage(chatId, {
        text: "🎵 *Please provide a song name*\n\nExample:\n.play shape of you",
      }, { quoted: msg });
      return;
    }

    try {
      // 🔍 Search for the song
      const { videos } = await yts(searchQuery);
      if (!videos || videos.length === 0) {
        await sock.sendMessage(chatId, { text: "❌ No songs found." }, { quoted: msg });
        return;
      }

      const video = videos[0];
      const outputDir = "./downloads";
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

      const safeTitle = video.title.replace(/[\\/:*?"<>|]/g, "");
      const outputFile = path.resolve(outputDir, `${safeTitle}.mp3`);

      // 📸 Send video preview before downloading
      await sock.sendMessage(chatId, {
        image: { url: video.thumbnail },
        caption: `🎧 *${video.title}*\n🕒 Duration: ${video.timestamp}\n👤 Channel: ${video.author.name}\n📺 [Watch on YouTube](${video.url})\n\n⏳ *Downloading audio...*\n\n⚡ *Powered by NexOra*`,
      }, { quoted: msg });

      // 📥 Download MP3 using yt-dlp
      const ytDlpCmd = `yt-dlp -x --audio-format mp3 -o "${outputFile}" "${video.url}"`;
      await new Promise((resolve, reject) => {
        exec(ytDlpCmd, (error, stdout, stderr) => {
          if (error) {
            console.error("yt-dlp error:", error);
            reject(error);
          } else {
            resolve();
          }
        });
      });

      // ✅ Send the downloaded MP3 file
      await sock.sendMessage(chatId, {
        audio: { url: outputFile },
        mimetype: "audio/mpeg",
        fileName: `${safeTitle}.mp3`,
        caption: `🎶 *${video.title}*\n\n⚡ *Powered by NexOra*`,
      }, { quoted: msg });

      // 🧹 Clean up the file after sending
      setTimeout(() => {
        fs.unlink(outputFile, (err) => {
          if (err) console.error("Failed to delete file:", err);
        });
      }, 15_000);

    } catch (err) {
      console.error("❌ play (yt-dlp) error:", err);
      await sock.sendMessage(chatId, {
        text: "🚨 Download failed. Please try again later.",
      }, { quoted: msg });
    }
  },
};
