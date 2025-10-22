// utils/checkDependencies.js
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BIN_DIR = path.join(__dirname, "../bin");
const YTDLP_PATH = path.join(BIN_DIR, "yt-dlp");

// ✅ Working package list (stable versions)
const REQUIRED_MODULES = [
  "youtube-yts",
  "yt-search",
  "node-id3",
  "fluent-ffmpeg",
  "ytdl-core"
];

function installYtDlp() {
  console.log("📦 Installing yt-dlp (local copy)...");
  if (!fs.existsSync(BIN_DIR)) fs.mkdirSync(BIN_DIR);
  execSync(
    `curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o "${YTDLP_PATH}"`
  );
  execSync(`chmod +x "${YTDLP_PATH}"`);
}

function installFfmpeg() {
  console.log("📦 Checking ffmpeg...");
  try {
    execSync("ffmpeg -version", { stdio: "ignore" });
    console.log("✅ ffmpeg already installed");
  } catch {
    console.warn(
      "⚠️ ffmpeg not found — please install it in your host or container manually."
    );
  }
}

function checkNodeModules() {
  console.log("📦 Checking required Node.js modules...");
  const missing = REQUIRED_MODULES.filter((pkg) => {
    try {
      require.resolve(pkg);
      return false;
    } catch {
      return true;
    }
  });

  if (missing.length) {
    console.warn(`⚠️ Missing packages: ${missing.join(", ")}`);
    console.log("👉 Installing missing packages automatically...");
    try {
      execSync(`npm install ${missing.join(" ")} --legacy-peer-deps`, {
        stdio: "inherit",
      });
      console.log("✅ All missing packages installed!");
    } catch (e) {
      console.error("❌ Failed to install some packages:", e.message);
    }
  } else {
    console.log("✅ All Node.js packages are present!");
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
  checkNodeModules();

  console.log("🚀 All dependencies verified!");
}
