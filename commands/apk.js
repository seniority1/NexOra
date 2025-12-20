import apk from "apkpure-scraper";
import axios from "axios";
import similarity from "string-similarity";
import fs from "fs";
import path from "path";

export default {
  name: "apk",
  description: "Search, fetch and download APK files",
  async execute(sock, msg, args) {
    if (!args.length) {
      return sock.sendMessage(
        msg.key.remoteJid,
        { text: "📦 Usage: apk <app name>\nExample: apk whatsapp" },
        { quoted: msg }
      );
    }

    const query = args.join(" ");
    const chatId = msg.key.remoteJid;

    await sock.sendMessage(
      chatId,
      { text: "🔍 Searching APK, please wait..." },
      { quoted: msg }
    );

    try {
      // 🔎 SEARCH
      const results = await apk.search(query);

      if (!results.length) {
        return sock.sendMessage(
          chatId,
          { text: "❌ No APK found." },
          { quoted: msg }
        );
      }

      // 🧠 AUTO-CORRECT APP NAME
      const names = results.map(r => r.name);
      const bestMatch = similarity.findBestMatch(query, names).bestMatch.target;
      const app = results.find(r => r.name === bestMatch);

      // 📦 APP INFO
      const details = await apk.app(app.id);

      const infoText = `
┏━━📦 *APK FOUND* ━━┓

📛 *Name:* ${details.name}
📦 *Package:* ${details.package}
🧩 *Version:* ${details.version}
📱 *Android:* ${details.androidVersion}
💾 *Size:* ${details.size}
⭐ *Rating:* ${details.rating}

⬇️ Downloading APK...
┗━━━━━━━━━━━━━━━━━━━━┛
      `;

      // 🖼 THUMBNAIL PREVIEW
      await sock.sendMessage(
        chatId,
        {
          image: { url: details.icon },
          caption: infoText.trim(),
        },
        { quoted: msg }
      );

      // ⬇️ DOWNLOAD APK
      const download = await apk.download(details.package);
      const filePath = path.join("./tmp", `${details.package}.apk`);

      if (!fs.existsSync("./tmp")) fs.mkdirSync("./tmp");

      const response = await axios({
        method: "GET",
        url: download.url,
        responseType: "stream",
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      // 📤 SEND APK FILE
      await sock.sendMessage(
        chatId,
        {
          document: fs.readFileSync(filePath),
          mimetype: "application/vnd.android.package-archive",
          fileName: `${details.name}.apk`,
        },
        { quoted: msg }
      );

      fs.unlinkSync(filePath); // cleanup

    } catch (err) {
      console.error(err);
      await sock.sendMessage(
        chatId,
        { text: "❌ Failed to fetch APK. Try another app name." },
        { quoted: msg }
      );
    }
  },
};
