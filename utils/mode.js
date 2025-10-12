import fs from "fs";

const MODE_FILE = "./mode.json";

// Ensure file exists
if (!fs.existsSync(MODE_FILE)) {
  fs.writeFileSync(MODE_FILE, JSON.stringify({ mode: "public" }, null, 2));
}

// 🔹 Get current mode
export function getMode() {
  try {
    const data = JSON.parse(fs.readFileSync(MODE_FILE));
    return data.mode || "public";
  } catch (err) {
    console.error("Error reading mode file:", err);
    return "public";
  }
}

// 🔹 Set mode
export function setMode(newMode) {
  try {
    fs.writeFileSync(MODE_FILE, JSON.stringify({ mode: newMode }, null, 2));
  } catch (err) {
    console.error("Error writing mode file:", err);
  }
}
