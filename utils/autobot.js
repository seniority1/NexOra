import fs from "fs";

const AUTO_CONFIG_PATH = "./data/autobot.json";

export let autoBotConfig = {
  autoTyping: false,
  autoRecording: false,
  autoRead: false,
  autoViewStatus: false,
  autoReact: false,
};

// ✅ Load saved auto settings
if (fs.existsSync(AUTO_CONFIG_PATH)) {
  try {
    const file = fs.readFileSync(AUTO_CONFIG_PATH, "utf8");
    const data = JSON.parse(file);
    autoBotConfig = { ...autoBotConfig, ...data };
    console.log("✅ AutoBot settings loaded:", autoBotConfig);
  } catch (err) {
    console.error("❌ Failed to load autobot.json:", err);
  }
} else {
  fs.mkdirSync("./data", { recursive: true });
  fs.writeFileSync(AUTO_CONFIG_PATH, JSON.stringify(autoBotConfig, null, 2));
}

// ✅ Save & toggle instantly
export function toggleAutoBot(key, value) {
  if (key in autoBotConfig) {
    autoBotConfig[key] = value;
    try {
      fs.writeFileSync(AUTO_CONFIG_PATH, JSON.stringify(autoBotConfig, null, 2));
      console.log(`💾 AutoBot setting saved: ${key} = ${value}`);
    } catch (err) {
      console.error("❌ Failed to save autobot.json:", err);
    }
    return true;
  }
  return false;
                    }
