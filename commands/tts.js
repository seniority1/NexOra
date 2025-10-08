import fs from "fs";
import path from "path";
import axios from "axios";
import gtts from "google-tts-api";
import { execFile } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
  name: "tts",
  description: "Convert text or replied message to speech",
  async execute(sock, msg, args) {
    const from = msg.key.remoteJid;
    const botName = "NexOra";

    let lang = "en";
    let ttsText = "";

    // 📝 If replying to a message, use its content
    if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
      const quoted = msg.message.extendedTextMessage.contextInfo.quotedMessage;
      ttsText =
        quoted.conversation ||
        quoted.extendedTextMessage?.text ||
        quoted.imageMessage?.caption ||
        quoted.videoMessage?.caption ||
        "";
    } else {
      if (args.length > 1) {
        lang = args[0];
        ttsText = args.slice(1).join(" ");
      } else {
        ttsText = args.join(" ");
      }
    }

    if (!ttsText) {
      return sock.sendMessage(
        from,
        {
          text: `⚠️ Usage:\n\`.tts Hello world\`\n\`.tts es Hola amigo\`\nOr reply to a message with \`.tts\``
        },
        { quoted: msg }
      );
    }

    // ✂️ Split text into 180-char chunks (Google TTS limit)
    function chunkText(str, size = 180) {
      const chunks = [];
      let i = 0;
      while (i < str.length) {
        chunks.push(str.slice(i, i + size));
        i += size;
      }
      return chunks;
    }

    const id = Date.now();
    const tempDir = path.join(__dirname, `tts_${id}`);
    fs.mkdirSync(tempDir);

    // ⏳ Send fake loading / progress message
    const loadingMessage = await sock.sendMessage(
      from,
      { text: "🎙️ Generating audio..." },
      { quoted: msg }
    );

    try {
      // 1️⃣ Split text into parts
      const parts = chunkText(ttsText);

      // 2️⃣ Download MP3 chunks
      const mp3Files = [];
      for (let i = 0; i < parts.length; i++) {
        const url = gtts.getAudioUrl(parts[i], { lang, slow: false });
        const res = await axios.get(url, { responseType: "arraybuffer" });
        const mp3Path = path.join(tempDir, `part${i}.mp3`);
        fs.writeFileSync(mp3Path, Buffer.from(res.data));
        mp3Files.push(mp3Path);
      }

      // 3️⃣ Create ffmpeg concat list
      const listFile = path.join(tempDir, "list.txt");
      fs.writeFileSync(listFile, mp3Files.map(f => `file '${f}'`).join("\n"));

      // 4️⃣ Merge chunks to final.ogg (voice note)
      const oggPath = path.join(tempDir, "final.ogg");
      await new Promise((resolve, reject) => {
        execFile(
          process.env.FFMPEG_PATH || "ffmpeg",
          [
            "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", listFile,
            "-c:a", "libopus",
            "-b:a", "64k",
            "-ac", "1",
            "-ar", "48000",
            oggPath
          ],
          (err) => (err ? reject(err) : resolve())
        );
      });

      // 5️⃣ Send the voice note
      const oggBuffer = fs.readFileSync(oggPath);
      await sock.sendMessage(
        from,
        {
          audio: oggBuffer,
          mimetype: "audio/ogg; codecs=opus",
          ptt: true,
        },
        { quoted: msg }
      );

      // 🧹 Cleanup temp files
      fs.rmSync(tempDir, { recursive: true, force: true });

      // ✅ Edit the "loading" message to show done
      await sock.sendMessage(from, {
        edit: loadingMessage.key,
        text: "✅ Audio generated successfully 🎧"
      });

    } catch (err) {
      console.error("❌ TTS error:", err);
      await sock.sendMessage(
        from,
        { text: "❌ Failed to generate TTS audio." },
        { quoted: msg }
      );
    }
  },
};
