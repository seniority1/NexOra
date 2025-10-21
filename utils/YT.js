import ytdl from "youtubedl-core"
import yts from "youtube-yts"
import ffmpeg from "fluent-ffmpeg"
import NodeID3 from "node-id3"
import fs from "fs"
import { randomBytes } from "crypto"
import ytM from "node-youtube-music"

const ytIdRegex =
  /(?:youtube\.com\/\S*(?:(?:\/e(?:mbed))?\/|watch\?(?:\S*?&?v\=))|youtu\.be\/)([a-zA-Z0-9_-]{6,11})/

class YT {
  static ensureDir() {
    const dir = "./XeonMedia/audio"
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }

  static isYTUrl(url) {
    return ytIdRegex.test(url)
  }

  static getVideoID(url) {
    if (!this.isYTUrl(url)) throw new Error("Not a YouTube URL")
    return ytIdRegex.exec(url)[1]
  }

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

  static async downloadMusic(query) {
    this.ensureDir()
    const tracks = await this.searchTrack(query)
    const song = tracks[0]
    const info = await ytdl.getInfo(song.url)
    const audioPath = `./XeonMedia/audio/${randomBytes(3).toString("hex")}.mp3`

    await new Promise((resolve, reject) => {
      ffmpeg(ytdl(song.url, { filter: "audioonly" }))
        .audioBitrate(128)
        .save(audioPath)
        .on("end", resolve)
        .on("error", reject)
    })

    await this.WriteTags(audioPath, {
      Title: song.title,
      Artist: song.artist,
      Album: song.album,
      Year: info.videoDetails.publishDate.split("-")[0],
      Image: song.image,
    })

    return { meta: song, path: audioPath }
  }

  static async mp3(url, metadata = {}, autoTag = false) {
    this.ensureDir()
    const videoUrl = this.isYTUrl(url)
      ? `https://www.youtube.com/watch?v=${this.getVideoID(url)}`
      : url

    const info = await ytdl.getInfo(videoUrl)
    const audioPath = `./XeonMedia/audio/${randomBytes(3).toString("hex")}.mp3`

    await new Promise((resolve, reject) => {
      ffmpeg(ytdl(videoUrl, { filter: "audioonly" }))
        .audioBitrate(128)
        .save(audioPath)
        .on("end", resolve)
        .on("error", reject)
    })

    if (autoTag) {
      await this.WriteTags(audioPath, {
        Title: info.videoDetails.title,
        Artist: info.videoDetails.author.name,
        Album: info.videoDetails.author.name,
        Year: info.videoDetails.publishDate.split("-")[0],
        Image: info.videoDetails.thumbnails.slice(-1)[0].url,
      })
    }

    return {
      meta: {
        title: info.videoDetails.title,
        artist: info.videoDetails.author.name,
      },
      path: audioPath,
    }
  }
}

export default YT
