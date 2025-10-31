import fs from "fs";

const startTime = Date.now();
const MODE_FILE = "./mode.json";

function getMode() {
  try {
    const data = JSON.parse(fs.readFileSync(MODE_FILE));
    return data.mode || "public";
  } catch {
    return "public";
  }
}

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
    const mode = getMode().toUpperCase();

  const menu = `
╔══════════════════════════╗
║ 🤖  *NexOra Bot Menu*  ║
╠══════════════════════════╣
║ 👑 Owner: Seniority
║ ⏱ Runtime: ${runtime}
║ 📡 Status: Online
║ ⚙ Mode: ${mode}
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
│ 👑 .myjid (Owner Only)
│ 💖 .love
│ 💥 .dare
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
│ 📄 .pdf <text/url>
│ ⚡ .speedtest
│ 🕵️ .vv2
│ 🖼️ .getppgc
│ 🖼️ .getpp
└─────────────────────────

📥 *DOWNLOADER* 📥
┌─────────────────────────┐
│ 🎵 .tiktok <link>
│ 📘 .fb <link>
│ ▶️ .yt <link>
│ 📸 .ig <link>
│ 🎬 .movie <name>
│ 🎶 .lyrics <song>
└─────────────────────────┘

⚡ *OWNER COMMANDS* ⚡
┌─────────────────────────┐
│ 🚫 .block @user
│ ✅ .unblock @user
│ 🧾 .blockedlist
│ 🧼 .clearchats
│ 🌍 .update
│ 📦 .backup
│ 📝 .setproname <name>
│ 🧠 .setbio <text>
│ 🖼️ .setpropic (reply img)
│ ♻️ .restart
│ 🔌 .shutdown
│ 👋 .leave
│ 📢 .broadcast group <text>
│ 📣 .broadcast all <text>
│ 💬 .broadcastchat <text>
│ 📂 .allgroups
│ 📡 .allchannels
│ 🔗 .join <link>
└─────────────────────────┘

⚙️ *BOT SETTINGS (OWNER ONLY)* ⚙️
┌─────────────────────────┐
│ 🔒 .mode private / public
│ 🔄 .autotoggle
│ 🔄 .autotoggle on/off
│ ✍️ .autotoggle autotyping on/off
│ 🟢 .autotoggle alwaysonline on/off
│ ➕ .addowner <jid>
│ ❌ .delowner <jid>
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
│ ⚡ .antidelete on/off
│ 🛡️ .welcome on/off
│ 👋 .goodbye on/off
│ ⛔ .ban @user <time>
│ ✅ .unban @user
│ 📋 .banlist
│ 🦵 .kickinactive
│ 📃 .listactive
│ 📃 .listinactive
└─────────────────────────┘

🧨 *EVIL MENU* 🧨
┌─────────────────────────┐
│ 🧠 .hijack (test only)
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
│ 🧠 .textmaker (show effects list)
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

🧰 *MISC* 🧰
┌─────────────────────────┐
│ 🖼️ Avatar-based effects
│ • .misc heart
│ • .misc horny
│ • .misc circle
│ • .misc lgbt
│ • .misc lied
│ • .misc lolice
│ • .misc simpcard
│ • .misc tonikawa
│
│ 🐶 Meme Templates
│ • .misc its-so-stupid <text>
│ • .misc namecard username|birthday|description(optional)
│ • .misc oogway <quote>
│ • .misc oogway2 <quote>
│
│ 🐦 Social Templates
│ • .misc tweet displayname|username|comment|theme(optional light/dark)
│ • .misc youtube-comment username|comment
│
│ 🌈 Overlay Effects
│ • .misc comrade
│ • .misc gay
│ • .misc glass
│ • .misc jail
│ • .misc passed
│ • .misc triggered
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

> 🧠 Powered by *NexOra*  
> 👑 Created by *Seniority*
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
