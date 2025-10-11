// utils/settings.js
import fs from "fs";

const SETTINGS_FILE = "./data/settings.json";

// 📝 Ensure data folder exists
if (!fs.existsSync("./data")) {
  fs.mkdirSync("./data");
}

// 📂 Load existing settings or create new
let settings = {};
if (fs.existsSync(SETTINGS_FILE)) {
  try {
    const fileData = fs.readFileSync(SETTINGS_FILE, "utf8");
    settings = JSON.parse(fileData);
  } catch (err) {
    console.error("❌ Failed to parse settings.json. Resetting file...");
    settings = {};
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  }
} else {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify({}, null, 2));
}

// ✅ Get settings for a specific group
export function getSetting(groupId) {
  return settings[groupId] || {};
}

// ✅ Set/update settings for a specific group
export function setSetting(groupId, newData) {
  settings[groupId] = {
    ...getSetting(groupId),
    ...newData,
  };
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

// ✅ Check if a feature is turned on for a group
export function isFeatureOn(groupId, feature) {
  return getSetting(groupId)[feature] === true;
}

// ✅ Remove group settings completely (optional utility)
export function clearGroupSettings(groupId) {
  delete settings[groupId];
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}
