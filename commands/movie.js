import axios from "axios";

export default {
  name: "movie",
  description: "Get movie information",
  async execute(sock, msg, args) {
    const title = args.join(" ");
    if (!title)
      return await sock.sendMessage(msg.key.remoteJid, {
        text: "🎬 *Usage:* .movie <movie title>",
      });

    try {
      const { data } = await axios.get(`https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=4a3b711b`);
      if (data.Response === "False")
        return await sock.sendMessage(msg.key.remoteJid, { text: "❌ Movie not found." });

      const info = `🎥 *${data.Title} (${data.Year})*\n⭐ ${data.imdbRating}/10\n📅 Released: ${data.Released}\n🎭 Genre: ${data.Genre}\n🎬 Director: ${data.Director}\n🧠 Plot: ${data.Plot}`;
      await sock.sendMessage(msg.key.remoteJid, { text: info });
    } catch (e) {
      await sock.sendMessage(msg.key.remoteJid, { text: "⚠️ Error fetching movie info." });
    }
  },
};
