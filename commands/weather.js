export default {
  name: "weather",
  description: "Get current weather or 3-day forecast for a city",
  async execute(sock, msg) {
    const botName = "NexOra";

    // 📥 Get message text & extract city + optional '3days'
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
    const args = text.trim().split(/\s+/).slice(1);
    const is3Days = args[args.length - 1]?.toLowerCase() === "3days";
    const city = is3Days ? args.slice(0, -1).join(" ") : args.join(" ");

    if (!city) {
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: "❌ Please provide a city name.\n👉 Example: `.weather London` or `.weather London 3days`" },
        { quoted: msg }
      );
      return;
    }

    try {
      // 🌍 1️⃣ Geocoding to get coordinates
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        throw new Error("City not found");
      }

      const { latitude, longitude, name, country } = geoData.results[0];

      if (is3Days) {
        // 🌦 2️⃣ 3-day forecast
        const forecastRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`
        );
        const forecastData = await forecastRes.json();

        const weatherConditions = {
          0: "☀️ Clear",
          1: "🌤 Mainly clear",
          2: "⛅ Partly cloudy",
          3: "☁️ Overcast",
          45: "🌫 Fog",
          51: "🌦 Drizzle",
          61: "🌧 Rain",
          71: "❄️ Snow",
          80: "🌦 Showers",
          95: "⛈ Thunderstorm",
        };

        const daily = forecastData.daily;
        let forecastList = "";

        for (let i = 0; i < 3; i++) {
          const date = daily.time[i];
          const max = daily.temperature_2m_max[i];
          const min = daily.temperature_2m_min[i];
          const code = daily.weathercode[i];
          const condition = weatherConditions[code] || "🌡 Weather";

          forecastList += `📅 *${date}*\n${condition}\n🌡 Max: ${max}°C | Min: ${min}°C\n\n`;
        }

        const forecastText = `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
      🌦 *3-DAY WEATHER FORECAST* 🌦

📍 *Location:* ${name}, ${country}

${forecastList.trim()}

┗━━━━━━━━━━━━━━━━━━━━┛
        `;

        await sock.sendMessage(
          msg.key.remoteJid,
          { text: forecastText.trim() },
          { quoted: msg }
        );
      } else {
        // 🌤 3️⃣ Current weather (as before)
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
        );
        const weatherData = await weatherRes.json();

        if (!weatherData.current_weather) throw new Error("No current weather data");

        const { temperature, windspeed, weathercode } = weatherData.current_weather;

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
      }
    } catch (err) {
      await sock.sendMessage(
        msg.key.remoteJid,
        { text: `❌ Couldn't fetch weather for *${city}*.\nPlease check the spelling or try again later.` },
        { quoted: msg }
      );
    }
  },
};
