export default {
  name: "apk",
  description: "Search and download APK from APKPure",
  async execute(sock, msg, args) {
    if (args.length === 0) {
      const usageText = `
┏━━🔍 *APK SEARCH* ━━┓

Please provide an app name!

📌 *Usage:* .apk <app name>
Example: .apk acode

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
┏━━🔍 *SEARCHING APK* ━━┓

🔎 Looking for: *${query}*
⏳ Please wait a moment...

┗━━━━━━━━━━━━━━━━┛
    `.trim();

    await sock.sendMessage(
      msg.key.remoteJid,
      { text: searchingText },
      { quoted: msg }
    );

    try {
      // Fetch search results from APKPure
      const searchRes = await fetch(`https://apkpure.com/search?q=${encodeURIComponent(query)}`);
      const searchHtml = await searchRes.text();

      // Simple regex to find the first app detail page link (usually the top result)
      const detailMatch = searchHtml.match(/<a class="dd" href="(\/[^"]+\/download\?[^"]+)"/);
      if (!detailMatch) throw new Error("No results found");

      const detailPath = detailMatch[1];
      const detailUrl = `https://apkpure.com${detailPath}`;

      // Get download page and extract direct APK URL
      const downloadRes = await fetch(detailUrl);
      const downloadHtml = await downloadRes.text();

      const apkMatch = downloadHtml.match(/<a[^>]+id="download_link"[^>]+href="([^"]+)"/);
      if (!apkMatch) throw new Error("Download link not found");

      const apkUrl = apkMatch[1];
      if (!apkUrl.startsWith("http")) {
        // Some links are relative
        apkUrl = "https://apkpure.com" + apkUrl;
      }

      const appName = query.charAt(0).toUpperCase() + query.slice(1);

      const successText = `
┏━━📱 *APK DOWNLOADER* ━━┓

✅ *App:* ${appName}
⬇️ Sending APK file...

⚠️ Install at your own risk!

┗━━━━━━━━━━━━━━━━┛
      `.trim();

      await sock.sendMessage(
        msg.key.remoteJid,
        { text: successText },
        { quoted: msg }
      );

      // Send the APK as a document
      await sock.sendMessage(msg.key.remoteJid, {
        document: { url: apkUrl },
        mimetype: "application/vnd.android.package-archive",
        fileName: `${appName}.apk`,
        caption: `${appName} APK from APKPure`,
      });

    } catch (error) {
      const errorText = `
┏━━❌ *APK ERROR* ━━┓

😕 Could not find or download "${query}"

Possible reasons:
• App not available on APKPure
• Temporary site issue

Try another name or check spelling!

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
