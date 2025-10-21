// commands/ytmp3.js
import YT from "../utils/YT.js"
import fs from "fs"

export default {
  name: "ytmp3",
  alias: ["song", "music"],
  desc: "Download YouTube video as MP3",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid
    const query = args.join(" ")

    if (!query) {
      await sock.sendMessage(from, { text: "❌ Please provide a YouTube link or song title." }, { quoted: msg })
      return
    }

    try {
      // 🎵 Inform user
      await sock.sendMessage(from, { text: "⏳ Downloading audio, please wait..." }, { quoted: msg })

      let result
      if (YT.isYTUrl(query)) {
        // If user gave a YouTube URL
        result = await YT.mp3(query, {}, true)
      } else {
        // If user gave a song title
        result = await YT.downloadMusic(query)
      }

      // 🎧 Send the audio file
      await sock.sendMessage(
        from,
        {
          audio: { url: result.path },
          mimetype: "audio/mpeg",
          fileName: `${result.meta.title}.mp3`,
          ptt: false,
        },
        { quoted: msg }
      )

      // 🗑️ Clean up
      fs.unlinkSync(result.path)
    } catch (err) {
      console.error("❌ Error in .ytmp3:", err)
      await sock.sendMessage(from, { text: "⚠️ Failed to download audio. Try again later." }, { quoted: msg })
    }
  },
}
