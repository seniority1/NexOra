// commands/play.js → 100% JavaScript version (works with your current bot)
const ytdl = require("ytdl-core");
const ytSearch = require("yt-search");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegStatic = require("@ffmpeg-installer/ffmpeg");

ffmpeg.setFfmpegPath(ffmpegStatic.path);

module.exports = {
  name: "play",
  description: "Play any song → .play davido funds",
  async execute(sock, msg, args) {
    const query = args.join(" ");
    if (!query) return sock.sendMessage(msg.key.remoteJid, { text: "Usage: `.play davido funds`" });

    const chatId = msg.key.remoteJid;

    await sock.sendMessage(chatId, { text: `Searching "${query}" on YouTube...` });

    // Search YouTube
    let video;
    try {
      const result = await ytSearch(query);
      video = result.videos[0];
      if (!video) return sock.sendMessage(chatId, { text: "Song not found!" });
    } catch (e) {
      return sock.sendMessage(chatId, { text: "Search failed. Try again later." });
    }

    const title = video.title;
    const duration = video.duration.timestamp || "Live";
    const thumb = video.thumbnail;

    await sock.sendMessage(chatId, {
      image: { url: thumb },
      caption: `Downloading...\n\n*\( {title}*\nDuration: \){duration}\nWait 5–20 secs...`
    });

    try {
      const stream = ytdl(video.url, {
        filter: "audioonly",
        quality: "highestaudio",
        highWaterMark: 1 << 25
      });

      const chunks = [];

      await new Promise((resolve, reject) => {
        ffmpeg(stream)
          .audioBitrate(128)
          .format("mp3")
          .on("error", reject)
          .on("end", resolve)
          .pipe()
          .on("data", chunk => chunks.push(chunk));
      });

      const audioBuffer = Buffer.concat(chunks);

      // Send real MP3 with cover & title
      await sock.sendMessage(chatId, {
        audio: audioBuffer,
        mimetype: "audio/mpeg",
        fileName: `${title.replace(/[^a-zA-Z0-9]/g, "_")}.mp3`,
        ptt: false,
        contextInfo: {
          externalAdReply: {
            title: title,
            body: "Now Playing ♪",
            thumbnail: await (await fetch(thumb)).buffer(),
            mediaType: 2,
            mediaUrl: video.url,
            sourceUrl: video.url
          }
        }
      });

      await sock.sendMessage(chatId, { text: "Enjoy the jam!" });

    } catch (error) {
      console.log(error);
      await sock.sendMessage(chatId, { text: "Can't download this song (age-restricted or blocked)." });
    }
  }
};
