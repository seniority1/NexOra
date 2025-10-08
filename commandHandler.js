import fs from "fs";
import path from "path";
import { OWNER_NUMBER } from "./config.js";

// 🔹 Load all commands from the /commands folder
const commands = new Map();
const files = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));

for (const file of files) {
  const { default: command } = await import(`./commands/${file}`);
  commands.set(command.name, command);
}

export async function handleCommand(sock, msg, body) {
  const from = msg.key.remoteJid;
  const sender = msg.key.participant || from;
  const prefix = ".";

  if (!body.startsWith(prefix)) return;

  const [cmdName, ...args] = body.slice(prefix.length).trim().split(/\s+/);
  const command = commands.get(cmdName.toLowerCase());
  if (!command) return;

  // 🔒 OWNER CHECK
  if (command.ownerOnly && sender !== OWNER_NUMBER) {
    return await sock.sendMessage(from, { text: "🚫 *Owner-only command!*" }, { quoted: msg });
  }

  // ✅ Execute
  try {
    await command.execute(sock, msg, args);
  } catch (err) {
    console.error(`❌ Error running ${cmdName}:`, err);
    await sock.sendMessage(from, { text: "⚠️ Command error!" }, { quoted: msg });
  }
}
