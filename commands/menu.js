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
╭━━━〔 *🤖 NexOra Menu* 〕━━━╮
👑 *Owner:*  Seniority  
⏱️ *Runtime:*  ${runtime}  
📡 *Status:*  Online  
⚙️ *Engine:*  Baileys  
╰━━━━━━━━━━━━━━━━━━━━╯

┏━🔥 *GENERAL* 🔥━┓  
┣ .menu  
┣ .help  
┣ .about  
┣ .ping  
┣ .time  
┣ .owner  
┣ .rules  
┣ .whoami  
┣ .fact  
┣ .joke  
┣ .quote  
┣ .weather  
┣ .news  
┣ .wiki  
┣ .crypto  
┗━━━━━━━━━━━━━━  
  
┏━🛠️ *UTILITY* 🛠️━┓  
┣ .define  
┣ .translate  
┣ .currency  
┣ .calc  
┣ .shorten  
┣ .expand  
┣ .qrcode  
┣ .scanqr  
┣ .remind  
┣ .ipinfo  
┗━━━━━━━━━━━━━━  
  
┏━⚡ *OWNER* ⚡━┓  
┣ .block @user  
┣ .unblock @user  
┣ .private  
┣ .public  
┣ .leave  
┣ .broadcast group <text>  
┣ .broadcast all <text>  
┣ .broadcastchat <text>  
┣ .autoviewstat on/off  
┣ .autotype on/off  
┣ .autorecord on/off  
┣ .autoreact on/off  
┣ .autoread on/off  
┣ .allgroups  
┣ .allchannels  
┗━━━━━━━━━━━━━━  
  
┏━👥 *GROUP (Admins)* 👥━┓  
┣ .kick  
┣ .add  
┣ .promote  
┣ .demote  
┣ .setname  
┣ .setdesc  
┣ .setrules  
┣ .clearrules  
┣ .setppgc  
┣ .link  
┣ .revoke  
┣ .tagall  
┣ .hidetag  
┣ .info  
┣ .mute  
┣ .umute  
┣ .antilink on/off  
┣ .antilinkdel on/off  
┣ .antibadwords on/off  
┣ .welcome on/off  
┣ .goodbye on/off  
┗━━━━━━━━━━━━━━━┛  
  
┏━🎉 *FUN* 🎉━┓  
┣ .sticker  
┣ .toimg  
┣ .tts <lang> <text>  
┣ .roll  
┣ .calc <expression>  
┣ .ai <prompt>  
┗━━━━━━━━━━━┛  
  
━━━━━━━━━━━━━━  
📌 *Join our official channel:*  
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
      { quoted: msg } // 👈 this makes the bot reply to the user's message
    );
  },
};    await sock.sendMessage(from, {
      image: { url: "https://raw.githubusercontent.com/iamedale/My-boy-asset/main/file_00000000044862438fca96d9cf92f1ca.png" }, // banner image
      caption: menu.trim(),
    });
  },
};
