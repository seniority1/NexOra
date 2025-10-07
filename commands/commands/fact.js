export default {
  name: "fact",
  description: "Send a random fun fact",
  async execute(sock, msg) {
    const botName = "NexOra";

    // 📚 Local fallback facts
    const localFacts = [
      "Honey never spoils — archaeologists have found edible honey in ancient Egyptian tombs.",
      "Bananas are berries, but strawberries are not.",
      "Octopuses have three hearts and blue blood.",
      "A day on Venus is longer than a year on Venus.",
      "There are more stars in the universe than grains of sand on Earth.",
      "Sharks existed before trees — they’re over 400 million years old.",
      "Hot water freezes faster than cold water — this is called the Mpemba effect.",
      "Wombat poop is cube-shaped to keep it from rolling away.",
      "The Eiffel Tower can be 15 cm taller during the summer due to heat expansion.",
      "Butterflies can taste with their feet."
    ];

    let factData;

    try {
      // 🌐 Try to fetch from a random fact API
      const res = await fetch("https://uselessfacts.jsph.pl/api/v2/facts/random?language=en");
      const data = await res.json();

      if (data && data.text) {
        factData = data.text;
      } else {
        // ❌ Invalid API response → fallback
        factData = localFacts[Math.floor(Math.random() * localFacts.length)];
      }
    } catch (err) {
      // 🚨 If fetch fails → fallback
      factData = localFacts[Math.floor(Math.random() * localFacts.length)];
    }

    const factText = `
┏━━🤖 *${botName.toUpperCase()} BOT* ━━┓
         🧠 *RANDOM FACT* 🧠

💡 ${factData}

┗━━━━━━━━━━━━━━━━━━━━┛
    `;

    await sock.sendMessage(
      msg.key.remoteJid,
      { text: factText.trim() },
      { quoted: msg }
    );
  },
};
