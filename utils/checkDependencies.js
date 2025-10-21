import { execSync } from "child_process";
import fs from "fs";

function isInstalled(cmd) {
  try {
    execSync(`command -v ${cmd}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function installYtDlp() {
  console.log("📦 Installing yt-dlp...");
  execSync(
    "curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/bin/yt-dlp && chmod a+rx /usr/bin/yt-dlp",
    { stdio: "inherit" }
  );
}

function installFfmpeg() {
  console.log("📦 Installing ffmpeg...");
  execSync("apt-get update -y && apt-get install -y ffmpeg", { stdio: "inherit" });
}

export default function checkDependencies() {
  console.log("🔍 Checking system dependencies...");

  if (!isInstalled("yt-dlp")) {
    installYtDlp();
  } else {
    console.log("✅ yt-dlp already installed");
  }

  if (!isInstalled("ffmpeg")) {
    installFfmpeg();
  } else {
    console.log("✅ ffmpeg already installed");
  }

  console.log("🚀 All dependencies verified!");
}
