export default {
  name: "modapk",
  description: "Search and download Modded APK from HappyMod",
  async execute(sock, msg, args) {
    if (args.length === 0) {
      const usageText = `
┏━━🎮 *MOD APK SEARCH* ━━┓

Please provide an app/game name!

📌 *Usage:* .modapk <app name>
Example: .modapk acode pro

┗━━━━━━━━━━━━━━━━┛
      `.trim();

      return await sock.sendMessage(
        msg.key.remoteJid,
        { text: usageText },
        { quoted: msg }
      );
    }

    const query = args.join(" ");
    const searchingText = `
┏━━🎮 *SEARCHING MOD APK* ━━┓

🔎 Looking for mod: *${query}*
⏳ Please wait a moment...

┗━━━━━━━━━━━━━━━━┛
    `.trim();

    await sock.sendMessage(
      msg.key.remoteJid,
      { text: searchingText },
      { quoted: msg }
    );

    try {
      // Step 1: Search on HappyMod
      const searchUrl = `https://happymod.com/search.html?q=${encodeURIComponent(query)}`;
      const searchRes = await fetch(searchUrl);
      const searchHtml = await searchRes.text();

      // Find the first result link (usually the best/modded one)
      const match = searchHtml.match(/<a href="(\/[^"]+-mod\/[^"]+\.html)"/);
      if (!match) throw new Error("No mod found");

      const appPath = match[1];
      const appUrl = `https://happymod.com${appPath}`;

      // Step 2: Get app page to find download page
      const appRes = await fetch(appUrl);
      const appHtml = await appRes.text();

      // Extract download page link
      const downloadMatch = appHtml.match(/<a[^>]+class="[^"]*download[^"]*"[^>]+href="([^"]+)"/);
      if (!downloadMatch) throw new Error("Download page not found");

      let downloadPath = downloadMatch[1];
      if (!downloadPath.startsWith("http")) {
        downloadPath = "https://happymod.com" + downloadPath;
      }

      // Step 3: Get actual APK direct link
      const downloadRes = await fetch(downloadPath);
      const downloadHtml = await downloadRes.text();

      const apkMatch = downloadHtml.match(/<a[^>]+id="download_link"[^>]+href="([^"]+)"/);
      if (!apkMatch) throw new Error("Direct APK link not found");

      let apkUrl = apkMatch[1];
      if (!apkUrl.startsWith("http")) {
        apkUrl = new URL(apkUrl, downloadPath).href;
      }

      const appName = query.charAt(0).toUpperCase() + query.slice(1);

      const successText = `
┏━━🎮 *MOD APK DOWNLOADER* ━━┓

✅ *Mod App:* ${appName} (Modded)
⬇️ Sending Mod APK file...

🔓 Usually includes: Unlimited money/coins, Premium unlocked, No ads
⚠️ Install at your own risk! Mods can contain risks.

┗━━━━━━━━━━━━━━━━┛
      `.trim();

      await sock.sendMessage(
        msg.key.remoteJid,
        { text: successText },
        { quoted: msg }
      );

      // Send the modded APK as document
      await sock.sendMessage(msg.key.remoteJid, {
        document: { url: apkUrl },
        mimetype: "application/vnd.android.package-archive",
        fileName: `${appName} Mod.apk`,
        caption: `${appName} Mod APK from HappyMod`,
      });

    } catch (error) {
      const errorText = `
┏━━❌ *MOD APK ERROR* ━━┓

😕 Could not find mod for "${query}"

Possible reasons:
• No mod available on HappyMod
• Site layout changed (scraper issue)
• Try different keywords (e.g., add "pro" or "mod")

┗━━━━━━━━━━━━━━━━┛
      `.trim();

      await sock.sendMessage(
        msg.key.remoteJid,
        { text: errorText },
        { quoted: msg }
      );
    }
  },
};
