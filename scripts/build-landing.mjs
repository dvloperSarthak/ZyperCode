import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const landingDir = path.join(rootDir, "zypercode-landing-website");
const distSrc = path.join(landingDir, "dist");
const distDest = path.join(rootDir, "dist");

console.log("==> Building ZyperCode Landing Website...");
execSync("npm install", { cwd: landingDir, stdio: "inherit" });
execSync("npm run build", { cwd: landingDir, stdio: "inherit" });

if (fs.existsSync(distSrc)) {
  fs.cpSync(distSrc, distDest, { recursive: true, force: true });
  console.log(`==> Successfully copied dist to ${distDest}`);
}
console.log("==> Netlify build completed successfully!");
