export default {
  name: "movie",
  description: "Search movie information",
  async execute(sock, msg, args) {
    if (args.length === 0) {
      const usageText = `
┏━━🎬 *MOVIE SEARCH* ━━┓

Please provide a movie name!

📌 *Usage:* .movie <movie name> [year optional]
Example: .movie inception
         .movie avatar 2009

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
┏━━🎬 *SEARCHING MOVIE* ━━┓

🔎 Looking for: *${query}*
⏳ Fetching details...

┗━━━━━━━━━━━━━━━━┛
    `.trim();

    await sock.sendMessage(
      msg.key.remoteJid,
      { text: searchingText },
      { quoted: msg }
    );

    try {
      const apiUrl = `https://theapache64.com/movie_db/search?keyword=${encodeURIComponent(query)}`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.error || !data.data) {
        throw new Error("No movie found");
      }

      const movie = data.data;
      const title = movie.name || "Unknown";
      const plot = movie.plot || "No plot available";
      const rating = movie.rating || "N/A";
      const genre = movie.genre || "N/A";
      const poster = movie.poster_url || "https://via.placeholder.com/300x450?text=No+Poster";

      const infoText = `
┏━━🎬 *MOVIE DETAILS* ━━┓

📽️ *Title:* ${title}
⭐ *IMDb Rating:* ${rating}/10
🗂️ *Genre:* ${genre}

📖 *Plot:*
${plot}

🔗 Powered by IMDb via MovieDB API

┗━━━━━━━━━━━━━━━━┛
      `.trim();

      // Send poster + details as image with caption
      await sock.sendMessage(msg.key.remoteJid, {
        image: { url: poster },
        caption: infoText,
      }, { quoted: msg });

    } catch (error) {
      const errorText = `
┏━━❌ *MOVIE NOT FOUND* ━━┓

😕 No results for:
🎬 *"${query}"*

Tips:
• Try full title + year (e.g., .movie avatar 2009)
• Check spelling
• Some older/indie films may not be available

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
