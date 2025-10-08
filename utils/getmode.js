import fs from "fs";

export function getMode() {
  try {
    const file = fs.readFileSync("./config.js", "utf8");
    const match = file.match(/mode:\s*["'](\w+)["']/);
    return match ? match[1] : "public";
  } catch {
    return "public";
  }
}
