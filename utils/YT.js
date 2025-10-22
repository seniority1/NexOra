// ✅ YouTube Utility for NexOra Bot
import { execSync } from "child_process"
import fs from "fs"
import path from "path"
import { randomBytes } from "crypto"
import yts from "youtube-yts"
import * as ytM from "node-youtube-music" // ✅ FIXED — proper import
import NodeID3 from "node-id3"

const BIN_DIR = path.join(process.cwd(), "bin")
const YTDLP_PATH = path.join(BIN_DIR, "yt-dlp")

// 🎵 YouTube URL pattern
const ytIdRegex =
  /(?:youtube\.com\/\S*(?:(?:\/e(?:mbed))?\/|watch\?(?:\S*?&?v=))|youtu\.be\/)([a-zA-Z0-9_-]{6,11})/

class YT {
  // ✅ Validate YouTube URL
  static isYTUrl(url) {
    return ytIdRegex.test(url)
  }

  static getVideoID(url) {
    if (!this.isYTUrl(url)) throw new Error("Not a YouTube URL")
    return ytIdRegex.exec(url)[1]
  }

  // 🏷️ Write MP3 Metadata Tags
  static async WriteTags(filePath, meta) {
    const { default: fetch } = await import("node-fetch")
    const imgBuffer = Buffer.from(await (await fetch(meta.Image)).arrayBuffer())

    NodeID3.write(
      {
        title: meta.Title,
        artist: meta.Artist,
        album: meta.Album,
        year: meta.Year || "",
        image: {
          mime: "jpeg",
          type: { id: 3, name: "front cover" },
          description: `Cover of ${meta.Title}`,
          imageBuffer: imgBuffer,
        },
      },
      filePath
    )
  }

  // 🔍 Search YouTube Music
  static async searchTrack(query) {
    const ytMusic = await ytM.searchMusics(query)
    return ytMusic.map((track) => ({
      title: `${track.title} - ${track.artists.map((x) => x.name).join(", ")}`,
      artist: track.artists.map((x) => x.name).join(", "),
      id: track.youtubeId,
      url: `https://youtu.be/${track.youtubeId}`,
      album: track.album,
      duration: track.duration,
      image: track.thumbnailUrl.replace("w120-h120", "w600-h600"),
    }))
  }

  // 🎶 Download by song title
  static async downloadMusic(query) {
    const dir = "./XeonMedia/audio"
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    const tracks = await this.searchTrack(query)
    if (!tracks.length) throw new Error("No results found")

    const song = tracks[0]
    const output = `${dir}/${randomBytes(3).toString("hex")}.mp3`

    try {
      console.log(`🎧 Downloading "${song.title}"...`)
      execSync(`"${YTDLP_PATH}" -x --audio-format mp3 -o "${output}" "${song.url}"`, {
        stdio: "ignore",
      })

      await this.WriteTags(output, {
        Title: song.title,
        Artist: song.artist,
        Album: song.album || "YouTube Music",
        Year: new Date().getFullYear(),
        Image: song.image,
      })

      console.log(`✅ Download complete: ${output}`)
      return { meta: song, path: output }
    } catch (err) {
      console.error("yt-dlp download error:", err.message)
      throw new Error("Download failed.")
    }
  }

  // 🎧 Download YouTube link directly
  static async mp3(url, metadata = {}, autoTag = false) {
    const dir = "./XeonMedia/audio"
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

    const videoUrl = this.isYTUrl(url)
      ? `https://www.youtube.com/watch?v=${this.getVideoID(url)}`
      : url

    const output = `${dir}/${randomBytes(3).toString("hex")}.mp3`

    try {
      console.log(`🎵 Downloading audio from ${videoUrl}`)
      execSync(`"${YTDLP_PATH}" -x --audio-format mp3 -o "${output}" "${videoUrl}"`, {
        stdio: "ignore",
      })

      if (autoTag) {
        await this.WriteTags(output, {
          Title: metadata.title || "YouTube Audio",
          Artist: metadata.artist || "Unknown Artist",
          Album: metadata.album || "YouTube",
          Year: metadata.year || new Date().getFullYear(),
          Image: metadata.image || "https://i.imgur.com/9JjA1Tw.png",
        })
      }

      console.log(`✅ MP3 saved: ${output}`)
      return {
        meta: {
          title: metadata.title || "Unknown Title",
          artist: metadata.artist || "Unknown Artist",
        },
        path: output,
      }
    } catch (err) {
      console.error("yt-dlp download error:", err.message)
      throw new Error("Download failed.")
    }
  }
}

export default YT
