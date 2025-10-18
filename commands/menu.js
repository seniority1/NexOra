const startTime = Date.now();

function formatRuntime(ms) {
  const sec = Math.floor(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h}h ${m}m ${s}s`;
}

export default {
  name: "menu",
  description: "Show the bot command menu",
  async execute(sock, msg) {
    const from = msg.key.remoteJid;
    const runtime = formatRuntime(Date.now() - startTime);

    const menu = `
╔══════════════════════════╗
║ 🤖  *NexOra Bot Menu*  ║
╠══════════════════════════╣
║ 👑 Owner: Seniority
║ ⏱ Runtime: ${runtime}
║ 📡 Status: Online
║ ⚙ Engine: Baileys
╚══════════════════════════╝

💥 *GENERAL* 💥
┌─────────────────────────┐
│ 💬 .menu
│ 📘 .help
│ ℹ️ .about
│ 📶 .ping
│ ⏰ .time
│ 👤 .owner
│ 📜 .rules
│ 💡 .fact
│ 😂 .joke
│ 🧠 .quote
│ ☁️ .weather
│ 📰 .news
│ 🌐 .wiki
│ 💰 .crypto
│ 🎥 .vv
└─────────────────────────┘

🛠️ *UTILITY* 🛠️
┌─────────────────────────┐
│ 📝 .define
│ 🌍 .translate
│ 💱 .currency
│ 🧮 .calc
│ 🔗 .shorten
│ 🔍 .expand
│ 📷 .qrcode
│ 🧾 .scanqr
│ ⏰ .remind
│ 🛰️ .ipinfo
│ 💾 .save
│ 🕵️ .vv2
└─────────────────────────┘

📥 *DOWNLOADER* 📥
┌─────────────────────────┐
│ 🎵 .tiktok <link>
│ 📘 .fb <link>
│ ▶️ .yt <link>
│ 📸 .ig <link>
└─────────────────────────┘

⚡ *OWNER* ⚡
┌─────────────────────────┐
│ 🚫 .block @user
│ ✅ .unblock @user
│ 🧾 .blockedlist
│ ♻️ .restart
│ 🔌 .shutdown
│ 🔒 .private
│ 🌐 .public
│ 👋 .leave
│ 📢 .broadcast group <text>
│ 📣 .broadcast all <text>
│ 💬 .broadcastchat <text>
│ ⚡ .autotoggle on/off
│ 📂 .allgroups
│ 📡 .allchannels
└─────────────────────────┘

👥 *GROUP (ADMINS)* 👥
┌─────────────────────────┐
│ 🦵 .kick
│ ➕ .add
│ ⬆️ .promote
│ ⬇️ .demote
│ 🏷️ .setname
│ 📝 .setdesc
│ 📜 .setrules
│ 🧹 .clearrules
│ 🖼️ .setppgc
│ 🔗 .link
│ ♻️ .revoke
│ 📣 .tagall
│ 👻 .hidetag
│ 🧾 .listonline
│ ℹ️ .info
│ 🔇 .mute
│ 🔊 .umute
│ ⛔ .antilink on/off
│ 🚫 .antilinkdel on/off
│ ❌ .antibadwords on/off
│ 🛡️ .welcome on/off
│ 👋 .goodbye on/off
│ ⛔ .ban @user <time>
│ ✅ .unban @user
│ 📋 .banlist
└─────────────────────────┘

🧨 *EVIL MENU* 🧨
┌─────────────────────────┐
│ 🧠 .hijack (for group with no permission)
│ 🖼️ .getpp 
└─────────────────────────┘

🐞 *BUG MENU* 🐞
┌─────────────────────────┐
│ 🌀 .lag
│ 👤 .mentionbug
│ 💥 .crash
│ 🧩 .stickerbug
│ 📢 .spam <count> <text>
└─────────────────────────┘

🎨 *TEXT LOGO MAKER* 🎨
┌─────────────────────────┐
│ 🧩 .textlogo <effect> <text>
│ 🧠 .textmaker  (Show effects list)
│
│ 🔥 fire       💡 neon
│ ❄️ ice        👹 devil
│ ⚡ thunder    🧠 hacker
│ 🟣 purple     🏖️ sand
│ 💥 glitch     🪴 leaves
│ 🧊 metallic   🎥 1917
│ 🎮 arena      💫 impressive
│ 🕶️ matrix     💡 light
│ 💖 blackpink  ⛄ snow
└─────────────────────────┘

🎉 *FUN* 🎉
┌─────────────────────────┐
│ 🖼️ .sticker
│ 🖼️ .toimg
│ 🗣️ .tts <lang> <text>
│ 🎲 .roll
│ 🤖 .ai <prompt>
└─────────────────────────┘

📌 *Channel:*  
https://whatsapp.com/channel/0029VbB4xAq3QxRwqM7VBc3C
`;

    await sock.sendMessage(
      from,
      {
        image: {
          url: "https://raw.githubusercontent.com/iamedale/My-boy-asset/main/file_00000000044862438fca96d9cf92f1ca.png",
        },
        caption: menu.trim(),
      },
      { quoted: msg }
    );
  },
};
