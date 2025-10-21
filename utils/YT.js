// utils/YT.js
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import yts from "yt-search";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const YTDLP_PATH = path.join(__dirname, "../bin/yt-dlp"); // local yt-dlp path

function isYTUrl(url) {
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(url);
}

async function downloadMusic(query) {
  const search = await yts(query);
  if (!search.videos.length) throw new Error("No results found.");
  const video = search.videos[0];
  return mp3(video.url);
}

async function mp3(url) {
  const outPath = `./temp-${Date.now()}.mp3`;
  const command = `"${YTDLP_PATH}" -x --audio-format mp3 -o "${outPath}" "${url}"`;

  try {
    execSync(command, { stdio: "ignore" });
    return { path: outPath, meta: { title: path.basename(outPath, ".mp3") } };
  } catch (err) {
    console.error("yt-dlp download error:", err.message);
    throw new Error("Download failed.");
  }
}

export default { isYTUrl, downloadMusic, mp3 };
