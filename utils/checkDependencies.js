// utils/checkDependencies.js
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BIN_DIR = path.join(__dirname, "../bin");
const YTDLP_PATH = path.join(BIN_DIR, "yt-dlp");

function isInstalled(cmd) {
  try {
    execSync(`command -v ${cmd}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function installYtDlp() {
  console.log("📦 Installing yt-dlp (local copy)...");
  if (!fs.existsSync(BIN_DIR)) fs.mkdirSync(BIN_DIR);
  execSync(`curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o "${YTDLP_PATH}"`);
  execSync(`chmod +x "${YTDLP_PATH}"`);
}

function installFfmpeg() {
  console.log("📦 Checking ffmpeg...");
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
    console.log("✅ ffmpeg already installed");
  } catch {
    console.warn("⚠️ ffmpeg not found — please install it in your host or container manually.");
  }
}

export default function checkDependencies() {
  console.log("🔍 Checking system dependencies...");

  if (!fs.existsSync(YTDLP_PATH)) {
    installYtDlp();
  } else {
    console.log("✅ Local yt-dlp found");
  }

  installFfmpeg();

  console.log("🚀 All dependencies verified!");
}
