import fs from "fs";

const modeFile = "./data/mode.json";

export function getMode() {
  if (!fs.existsSync(modeFile)) {
    fs.writeFileSync(modeFile, JSON.stringify({ mode: "public" }, null, 2));
  }
  const data = JSON.parse(fs.readFileSync(modeFile));
  return data.mode;
}

export function setMode(newMode) {
  fs.writeFileSync(modeFile, JSON.stringify({ mode: newMode }, null, 2));
}
