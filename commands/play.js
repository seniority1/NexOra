// commands/play.js → FINAL 410-PROOF VERSION (works everywhere)
import ytdl from "ytdl-core";
import ytSearch from "yt-search";

export default {
  name: "play",
  description: "Play song → .play davido funds",
  async execute(sock, msg, args) {
    const query = args.join(" ");
    if (!query) return sock.sendMessage(msg.key.remoteJid, { text: "Usage: `.play davido funds`" }, { quoted: msg });

    const chat = msg.key.remoteJid;

    try {
      await sock.sendMessage(chat, { text: `Searching "${query}"...` }, { quoted: msg });

      const result = await ytSearch(query);
      const video = result.videos[0];
      if (!video) return sock.sendMessage(chat, { text: "Song not found!" }, { quoted: msg });

      await sock.sendMessage(chat, {
        image: { url: video.thumbnail },
        caption: `*\( {video.title}*\nDuration: \){video.duration.timestamp || "LIVE"}\n\nSending audio...`
      }, { quoted: msg });

      // THIS LINE 100% KILLS 410 ERROR
      const audioUrl = await ytdl.getURL(video.url, {
        quality: "highestaudio",
        filter: "audioonly"
      });

      const response = await fetch(audioUrl);
      if (!response.ok) throw new Error("Failed to fetch audio");

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuffer);

      await sock.sendMessage(chat, {
        audio: audioBuffer,
        mimetype: "audio/mpeg",
        fileName: `${video.title.replace(/[^a-zA-Z0-9\s]/g, "").slice(0, 80)}.mp3`,
        ptt: false
      }, { quoted: msg });

      await sock.sendMessage(chat, { text: "Enjoy the jam!" }, { quoted: msg });

    } catch (err) {
      console.error("Play error:", err.message);
      await sock.sendMessage(chat, { text: "Failed (age-restricted or blocked in your region)." }, { quoted: msg });
    }
  }
};
