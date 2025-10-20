// commands/misc.js
import axios from "axios";
import { downloadContentFromMessage } from "@whiskeysockets/baileys";
import { uploadImage } from "../utils/uploadImage.js";

async function getQuotedOrOwnImageUrl(sock, msg) {
  // 1️⃣ Quoted image
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  if (quoted?.imageMessage) {
    const stream = await downloadContentFromMessage(quoted.imageMessage, "image");
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);
    return await uploadImage(buffer);
  }

  // 2️⃣ Image in current message
  if (msg.message?.imageMessage) {
    const stream = await downloadContentFromMessage(msg.message.imageMessage, "image");
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);
    return await uploadImage(buffer);
  }

  // 3️⃣ Avatar (mentioned / replied / sender)
  let targetJid;
  const ctx = msg.message?.extendedTextMessage?.contextInfo;
  if (ctx?.mentionedJid?.length > 0) {
    targetJid = ctx.mentionedJid[0];
  } else if (ctx?.participant) {
    targetJid = ctx.participant;
  } else {
    targetJid = msg.key.participant || msg.key.remoteJid;
  }

  try {
    const url = await sock.profilePictureUrl(targetJid, "image");
    return url;
  } catch {
    return "https://i.imgur.com/2wzGhpF.png"; // fallback
  }
}

export default {
  name: "misc",
  description: "Fun image & meme manipulation commands",

  async execute(sock, msg, args) {
    const chatId = msg.key.remoteJid;
    const sub = (args[0] || "").toLowerCase();
    const rest = args.slice(1);

    async function simpleAvatarOnly(endpoint, path = "misc") {
      const avatarUrl = await getQuotedOrOwnImageUrl(sock, msg);
      const url = `https://api.some-random-api.com/canvas/${path}/${endpoint}?avatar=${encodeURIComponent(avatarUrl)}`;
      const response = await axios.get(url, { responseType: "arraybuffer" });
      await sock.sendMessage(chatId, { image: Buffer.from(response.data) }, { quoted: msg });
    }

    try {
      switch (sub) {
        // ✅ Avatar effects
        case "heart":
        case "horny":
        case "circle":
        case "lgbt":
        case "lied":
        case "lolice":
        case "simpcard":
        case "tonikawa":
        case "blur":
        case "invert":
        case "greyscale":
        case "sepia":
        case "pixelate":
        case "wasted":
        case "passed":
        case "triggered":
        case "jail":
        case "glass":
        case "comrade":
        case "gay":
          await simpleAvatarOnly(sub, ["blur","invert","greyscale","sepia","pixelate","wasted"].includes(sub) ? "effect" : "overlay");
          break;

        // ✅ Meme templates with text
        case "its-so-stupid": {
          const dog = rest.join(" ").trim();
          if (!dog) {
            await sock.sendMessage(chatId, { text: "Usage: .misc its-so-stupid <text>" }, { quoted: msg });
            return;
          }
          const avatarUrl = await getQuotedOrOwnImageUrl(sock, msg);
          const url = `https://api.some-random-api.com/canvas/misc/its-so-stupid?dog=${encodeURIComponent(dog)}&avatar=${encodeURIComponent(avatarUrl)}`;
          const response = await axios.get(url, { responseType: "arraybuffer" });
          await sock.sendMessage(chatId, { image: Buffer.from(response.data) }, { quoted: msg });
          break;
        }

        case "namecard": {
          const joined = rest.join(" ");
          const [username, birthday, description] = joined.split("|").map(s => (s || "").trim());
          if (!username || !birthday) {
            await sock.sendMessage(chatId, { text: "Usage: .misc namecard username|birthday|description(optional)" }, { quoted: msg });
            return;
          }
          const avatarUrl = await getQuotedOrOwnImageUrl(sock, msg);
          const params = new URLSearchParams({ username, birthday, avatar: avatarUrl });
          if (description) params.append("description", description);
          const url = `https://api.some-random-api.com/canvas/misc/namecard?${params.toString()}`;
          const response = await axios.get(url, { responseType: "arraybuffer" });
          await sock.sendMessage(chatId, { image: Buffer.from(response.data) }, { quoted: msg });
          break;
        }

        case "oogway":
        case "oogway2": {
          const quote = rest.join(" ").trim();
          if (!quote) {
            await sock.sendMessage(chatId, { text: `Usage: .misc ${sub} <quote>` }, { quoted: msg });
            return;
          }
          const avatarUrl = await getQuotedOrOwnImageUrl(sock, msg);
          const url = `https://api.some-random-api.com/canvas/misc/${sub}?quote=${encodeURIComponent(quote)}&avatar=${encodeURIComponent(avatarUrl)}`;
          const response = await axios.get(url, { responseType: "arraybuffer" });
          await sock.sendMessage(chatId, { image: Buffer.from(response.data) }, { quoted: msg });
          break;
        }

        case "tweet": {
          const joined = rest.join(" ");
          const [displayname, username, comment, theme] = joined.split("|").map(s => (s || "").trim());
          if (!displayname || !username || !comment) {
            await sock.sendMessage(chatId, { text: "Usage: .misc tweet displayname|username|comment|theme(optional)" }, { quoted: msg });
            return;
          }
          const avatarUrl = await getQuotedOrOwnImageUrl(sock, msg);
          const params = new URLSearchParams({ displayname, username, comment, avatar: avatarUrl });
          if (theme) params.append("theme", theme);
          const url = `https://api.some-random-api.com/canvas/misc/tweet?${params.toString()}`;
          const response = await axios.get(url, { responseType: "arraybuffer" });
          await sock.sendMessage(chatId, { image: Buffer.from(response.data) }, { quoted: msg });
          break;
        }

        case "youtube-comment": {
          const joined = rest.join(" ");
          const [username, comment] = joined.split("|").map(s => (s || "").trim());
          if (!username || !comment) {
            await sock.sendMessage(chatId, { text: "Usage: .misc youtube-comment username|comment" }, { quoted: msg });
            return;
          }
          const avatarUrl = await getQuotedOrOwnImageUrl(sock, msg);
          const params = new URLSearchParams({ username, comment, avatar: avatarUrl });
          const url = `https://api.some-random-api.com/canvas/misc/youtube-comment?${params.toString()}`;
          const response = await axios.get(url, { responseType: "arraybuffer" });
          await sock.sendMessage(chatId, { image: Buffer.from(response.data) }, { quoted: msg });
          break;
        }

        // ✅ Meme templates (no avatar required)
        case "changemymind":
        case "drake":
        case "facts":
        case "wanted": {
          const text = rest.join(" ").trim();
          if (!text) {
            await sock.sendMessage(chatId, { text: `Usage: .misc ${sub} <text>` }, { quoted: msg });
            return;
          }
          const url = `https://api.some-random-api.com/canvas/meme/${sub}?text=${encodeURIComponent(text)}`;
          const response = await axios.get(url, { responseType: "arraybuffer" });
          await sock.sendMessage(chatId, { image: Buffer.from(response.data) }, { quoted: msg });
          break;
        }

        // ✅ Dynamic templates
        case "ship": {
          const [user1, user2] = rest;
          if (!user1 || !user2) {
            await sock.sendMessage(chatId, { text: "Usage: .misc ship <name1> <name2>" }, { quoted: msg });
            return;
          }
          const url = `https://api.some-random-api.com/canvas/misc/ship?user1=${encodeURIComponent(user1)}&user2=${encodeURIComponent(user2)}`;
          const response = await axios.get(url, { responseType: "arraybuffer" });
          await sock.sendMessage(chatId, { image: Buffer.from(response.data) }, { quoted: msg });
          break;
        }

        case "quote":
        case "animequote": {
          const text = rest.join(" ").trim();
          if (!text) {
            await sock.sendMessage(chatId, { text: `Usage: .misc ${sub} <text>` }, { quoted: msg });
            return;
          }
          const avatarUrl = await getQuotedOrOwnImageUrl(sock, msg);
          const url = `https://api.some-random-api.com/canvas/misc/${sub}?quote=${encodeURIComponent(text)}&avatar=${encodeURIComponent(avatarUrl)}`;
          const response = await axios.get(url, { responseType: "arraybuffer" });
          await sock.sendMessage(chatId, { image: Buffer.from(response.data) }, { quoted: msg });
          break;
        }

        // ✅ Help menu
        default:
          await sock.sendMessage(chatId, {
            text: `
┏━━🎨 *MISC COMMANDS* ━━┓
👤 Avatar Effects:
• heart, horny, circle, lgbt, lied, lolice, simpcard, tonikawa
• blur, invert, greyscale, sepia, pixelate, wasted, passed, triggered, jail, glass, comrade, gay

🐶 Meme Templates:
• its-so-stupid <text>
• namecard username|birthday|desc
• oogway <q>, oogway2 <q>
• changemymind <text>, drake <text>, facts <text>, wanted <text>

🐦 Social Templates:
• tweet dn|un|comment|theme
• youtube-comment un|comment
• ship <name1> <name2>
• quote <text>, animequote <text>

💡 Tip: You can reply to an image, send one with command, or mention a user to use their avatar.
┗━━━━━━━━━━━━━━━━━━┛
            `.trim()
          }, { quoted: msg });
          break;
      }
    } catch (error) {
      console.error("Error in misc command:", error);
      await sock.sendMessage(chatId, { text: "❌ Failed to generate image. Try again later." }, { quoted: msg });
    }
  },
};
