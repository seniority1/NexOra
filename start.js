import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const packageJsonPath = path.join(__dirname, "package.json");

// 🧠 Function to scan all JS files for external imports
function scanImports(dir) {
  const found = new Set();

  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (file !== "node_modules") {
        scanImports(fullPath).forEach(pkg => found.add(pkg));
      }
    } else if (file.endsWith(".js")) {
      const content = fs.readFileSync(fullPath, "utf-8");
      const importRegex = /(?:import|from)\s+['"]([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(content))) {
        const pkg = match[1];
        if (!pkg.startsWith(".") && !pkg.startsWith("/")) {
          // Support @scoped/package names
          const parts = pkg.split("/");
          const pkgName = pkg.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
          found.add(pkgName);
        }
      }
    }
  }

  return found;
}

// 📦 Load current package.json
let packageJson = {};
try {
  packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
} catch (err) {
  console.error("❌ Failed to read package.json:", err);
  process.exit(1);
}

if (!packageJson.dependencies) packageJson.dependencies = {};

// 📂 Find required deps from project files
const requiredDeps = Array.from(scanImports(__dirname));
console.log("🔍 Detected dependencies:", requiredDeps.length ? requiredDeps.join(", ") : "(none)");

let missingDeps = [];
for (const dep of requiredDeps) {
  try {
    await import(dep);
  } catch {
    if (!packageJson.dependencies[dep]) {
      console.log(`📦 Missing: ${dep}`);
      missingDeps.push(dep);
    }
  }
}

// 📝 Add missing deps to package.json
if (missingDeps.length > 0) {
  for (const dep of missingDeps) {
    packageJson.dependencies[dep] = "latest";
  }
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log("📝 Updated package.json with missing dependencies.");
}

// 🚀 Install missing dependencies
if (missingDeps.length > 0) {
  try {
    console.log("📥 Installing new dependencies...");
    execSync(`npm install --legacy-peer-deps`, { stdio: "inherit" });
    console.log("✅ All dependencies installed.");
  } catch (err) {
    console.error("❌ Failed to install dependencies:", err);
    process.exit(1);
  }
}

// ✅ Start the bot after everything is ready
await import("./index.js");
