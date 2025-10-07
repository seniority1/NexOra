export default {
  name: "weather",
  description: "Get current weather info for a city",
  async execute(sock, msg) {
    const botName = "NexOra";

    // 🌐 Extract the city name from the message text
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
    const args = text.trim().split(/\s+/).slice(1); // remove the command itself
    const city = args.join(" ");

    if (!city) {
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: "❌ Please provide a city name.\n👉 Example: `.weather London`" },
        { quoted: msg }
      );
      return;
    }

    try {
      // 🌍 First get coordinates using Open-Meteo Geocoding API
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        throw new Error("City not found");
      }

      const { latitude, longitude, name, country } = geoData.results[0];

      // 🌦 Fetch current weather data using coordinates
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
      );
      const weatherData = await weatherRes.json();

      if (!weatherData.current_weather) {
        throw new Error("Weather not available");
      }

      const { temperature, windspeed, weathercode } = weatherData.current_weather;

      // 📝 Translate weather code into a simple description
      const weatherConditions = {
        0: "☀️ Clear sky",
        1: "🌤 Mainly clear",
        2: "⛅ Partly cloudy",
        3: "☁️ Overcast",
        45: "🌫 Fog",
        48: "🌫 Depositing rime fog",
        51: "🌦 Light drizzle",
        61: "🌧 Light rain",
        71: "❄️ Light snow",
        80: "🌦 Showers",
        95: "⛈ Thunderstorm",
      };
      const condition = weatherConditions[weathercode] || "🌡 Weather data";

      const weatherText = `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
        🌤 *CURRENT WEATHER* 🌤

📍 *Location:* ${name}, ${country}  
🌡 *Temperature:* ${temperature}°C  
💨 *Wind Speed:* ${windspeed} km/h  
🌥 *Condition:* ${condition}

┗━━━━━━━━━━━━━━━━━━━━┛
      `;

      await sock.sendMessage(
        msg.key.remoteJid,
        { text: weatherText.trim() },
        { quoted: msg }
      );
    } catch (err) {
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: `❌ Couldn't fetch weather for *${city}*.\nPlease check the spelling or try again later.` },
        { quoted: msg }
      );
    }
  },
};
