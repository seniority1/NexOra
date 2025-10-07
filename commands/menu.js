import os from "os";
import moment from "moment";
import prettyMs from "pretty-ms";

const startTime = Date.now();

export default async function menuCommand(sock, msg) {
  const from = msg.key.remoteJid;

  // 🕒 Calculate bot uptime dynamically
  const runtime = prettyMs(Date.now() - startTime, { compact: true });

  const menuText = `
╭━━━〔 *🤖 NoxOra Menu* 〕━━━╮

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

  await sock.sendMessage(from, {
    image: { url: "https://raw.githubusercontent.com/iamedale/My-boy-asset/main/file_00000000044862438fca96d9cf92f1ca.png" }, // Replace with your custom banner
    caption: menuText.trim(),
  });
}
