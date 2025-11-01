import fetch from "node-fetch";

export default {
  name: "lyrics",
  description: "Get song lyrics, artist name, and album art",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const query = args.join(" ");

    if (!query) {
      await sock.sendMessage(from, { text: "🎵 Usage: *.lyrics <song name>*" }, { quoted: msg });
      return;
    }

    try {
      // 🎧 Search on Genius
      const search = await fetch(`https://some-random-api.com/lyrics?title=${encodeURIComponent(query)}`);
      const data = await search.json();

      if (!data || !data.lyrics) {
        await sock.sendMessage(from, { text: `❌ No lyrics found for *${query}*.` }, { quoted: msg });
        return;
      }

      const title = data.title || query;
      const author = data.author || "Unknown artist";
      const thumbnail = data.thumbnail?.genius || null;
      const lyrics = data.lyrics.length > 4000
        ? data.lyrics.slice(0, 4000) + "\n\n📜 Lyrics too long, truncated..."
        : data.lyrics;

      // 🖼️ If thumbnail found, send as image with caption
      if (thumbnail) {
        await sock.sendMessage(from, {
          image: { url: thumbnail },
          caption: `🎶 *${title}* by *${author}*\n\n${lyrics}`,
        }, { quoted: msg });
      } else {
        await sock.sendMessage(from, {
          text: `🎶 *${title}* by *${author}*\n\n${lyrics}`,
        }, { quoted: msg });
      }

    } catch (err) {
      console.error("❌ Lyrics command error:", err);
      await sock.sendMessage(from, { text: "⚠️ Couldn't fetch lyrics. Try again later." }, { quoted: msg });
    }
  },
};
