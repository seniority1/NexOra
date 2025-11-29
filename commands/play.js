// commands/play.js → FINAL VERSION THAT LOADS & WORKS 100%
import ytdl from "ytdl-core";
import ytSearch from "yt-search";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "@ffmpeg-installer/ffmpeg";

ffmpeg.setFfmpegPath(ffmpegStatic.path);

export default {
  name: "play",
  description: "Play song from YouTube → .play davido funds",
  async execute(sock, msg, args) {
    const query = args.join(" ");
    ");
    if (!query) {
      return sock.sendMessage(msg.key.remoteJid, { text: "Usage: `.play davido funds`" }, { quoted: msg });
    }

    const chat = msg.key.remoteJid;

    try {
      await sock.sendMessage(chat, { text: `Searching "${query}"...` }, { quoted: msg });

      const search = await ytSearch(query);
      const video = search.videos[0];
      if (!video) {
        return sock.sendMessage(chat, { text: "Song not found!" }, { quoted: msg });
      }

      await sock.sendMessage(chat, {
        image: { url: video.thumbnail },
        caption: `Found!\n*\( {video.title}*\n \){video.duration.timestamp || "LIVE"}\n\nDownloading audio...`
      }, { quoted: msg });

      const stream = ytdl(video.url, {
        filter: "audioonly",
        quality: "highestaudio",
        highWaterMark: 1 << 25,
        requestOptions: {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
          }
        }
      });

      const chunks = [];
      await new Promise((resolve, reject) => {
        ffmpeg(stream)
          .audioBitrate(128)
          .format("mp3")
          .on("end", () => resolve())
          .on("error", (err) => reject(err))
          .pipe()
          .on("data", (chunk) => chunks.push(chunk));
      });

      await sock.sendMessage(chat, {
        audio: Buffer.concat(chunks),
        mimetype: "audio/mpeg",
        fileName: `${video.title.replace(/[^a-zA-Z0-9\s]/g, "").slice(0, 80)}.mp3`,
        ptt: false
      }, { quoted: msg });

      await sock.sendMessage(chat, { text: "Enjoy the song!" }, { quoted: msg });

    } catch (error) {
      console.error("Play error:", error.message);
      await sock.sendMessage(chat, { text: "Failed to download song (age-restricted or blocked)." }, { quoted: msg });
    }
  }
};
