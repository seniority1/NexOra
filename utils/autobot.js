// utils/autobot.js
import fs from "fs";

const AUTO_FILE = "./autobot.json";

// Ensure file exists
if (!fs.existsSync(AUTO_FILE)) {
  fs.writeFileSync(
    AUTO_FILE,
    JSON.stringify(
      {
        autoTyping: false,
        autoRecording: false,
        autoRead: false,
        autoViewStatus: false,
        autoReact: false,
        alwaysOnline: false, // ✅ new one
      },
      null,
      2
    )
  );
}

export const autoBotConfig = JSON.parse(fs.readFileSync(AUTO_FILE));

export function toggleAutoBot(key, value) {
  autoBotConfig[key] = value;
  fs.writeFileSync(AUTO_FILE, JSON.stringify(autoBotConfig, null, 2));
}
