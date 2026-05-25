const fs = require("fs");
const path = require("path");

const ASSET_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".webp",
  ".ico",
]);

function isAssetFile(fileName) {
  if (fileName.endsWith(".template.html")) return true;
  const ext = path.extname(fileName).toLowerCase();
  return ASSET_EXTENSIONS.has(ext);
}

function copyDirRecursive(srcDir, distDir) {
  fs.mkdirSync(distDir, { recursive: true });

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  let copiedCount = 0;

  for (const entry of entries) {
    const fromPath = path.join(srcDir, entry.name);
    const toPath = path.join(distDir, entry.name);

    if (entry.isDirectory()) {
      copiedCount += copyDirRecursive(fromPath, toPath);
      continue;
    }

    if (!entry.isFile() || !isAssetFile(entry.name)) continue;

    fs.copyFileSync(fromPath, toPath);
    copiedCount += 1;
  }

  return copiedCount;
}

function copySharedTemplates() {
  const srcDir = path.join(process.cwd(), "src/modules/shared/templates");
  const distDir = path.join(process.cwd(), "dist/modules/shared/templates");

  if (!fs.existsSync(srcDir)) {
    console.warn(`[copy-shared-templates] Source directory not found: ${srcDir}`);
    return;
  }

  const copiedCount = copyDirRecursive(srcDir, distDir);

  if (copiedCount === 0) {
    console.warn(`[copy-shared-templates] No template or asset files found in: ${srcDir}`);
    return;
  }

  console.log(
    `[copy-shared-templates] Copied ${copiedCount} file(s) to ${distDir}`
  );
}

copySharedTemplates();

