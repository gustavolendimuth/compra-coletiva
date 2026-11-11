#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const SEARCH_ROOTS = [process.cwd()];

const EXECUTABLE_PREFIXES = ["schema-engine-", "query-engine-", "prisma-fmt-"];

function ensureExecutable(filePath) {
  const stats = fs.statSync(filePath);
  const nextMode = stats.mode | 0o111;

  if (stats.mode === nextMode) {
    return false;
  }

  fs.chmodSync(filePath, nextMode);
  return true;
}

function fixInRoot(rootDir) {
  const enginesDir = path.join(rootDir, "node_modules", "@prisma", "engines");

  if (!fs.existsSync(enginesDir)) {
    return [];
  }

  const changed = [];
  const files = fs.readdirSync(enginesDir);

  for (const file of files) {
    if (!EXECUTABLE_PREFIXES.some((prefix) => file.startsWith(prefix))) {
      continue;
    }

    const fullPath = path.join(enginesDir, file);

    try {
      if (ensureExecutable(fullPath)) {
        changed.push(fullPath);
      }
    } catch (error) {
      console.warn(`[prisma-perms] Falha ao ajustar ${fullPath}: ${error.message}`);
    }
  }

  return changed;
}

const allChanged = [];

for (const root of SEARCH_ROOTS) {
  allChanged.push(...fixInRoot(root));
}

if (allChanged.length > 0) {
  console.log("[prisma-perms] Permissoes corrigidas:");
  for (const file of allChanged) {
    console.log(` - ${file}`);
  }
} else {
  console.log("[prisma-perms] Nenhum ajuste necessario.");
}
