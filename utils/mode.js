import fs from "fs";

const MODE_FILE = "./mode.json";

// ✅ Ensure mode file exists
if (!fs.existsSync(MODE_FILE)) {
  fs.writeFileSync(MODE_FILE, JSON.stringify({ mode: "public" }, null, 2));
}

// ✅ Get current mode
export function getMode() {
  const data = JSON.parse(fs.readFileSync(MODE_FILE));
  return data.mode || "public";
}

// ✅ Set mode (private or public)
export function setMode(newMode) {
  const mode = newMode.toLowerCase();
  if (!["public", "private"].includes(mode)) return false;
  fs.writeFileSync(MODE_FILE, JSON.stringify({ mode }, null, 2));
  return true;
}
