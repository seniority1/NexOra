// utils/refreshCookies.js
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

const cookiesPath = path.resolve("cookies.txt");

export async function refreshCookies() {
  console.log("🌐 Launching headless Chrome to refresh YouTube cookies...");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();
  await page.goto("https://www.youtube.com", { waitUntil: "networkidle2" });

  // Wait for cookies and extract them
  const cookies = await page.cookies();

  // Convert cookies to Netscape format (yt-dlp compatible)
  const lines = [
    "# Netscape HTTP Cookie File",
    "# Auto-generated for yt-dlp",
  ];

  for (const c of cookies) {
    lines.push(
      [
        c.domain,
        "TRUE",
        c.path,
        c.secure ? "TRUE" : "FALSE",
        Math.floor(c.expires) || 0,
        c.name,
        c.value,
      ].join("\t")
    );
  }

  fs.writeFileSync(cookiesPath, lines.join("\n"));
  console.log(`✅ Cookies refreshed and saved to ${cookiesPath}`);

  await browser.close();
}
