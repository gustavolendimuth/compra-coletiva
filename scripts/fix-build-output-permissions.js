#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const projectRoot = process.cwd();
const uid = typeof process.getuid === "function" ? process.getuid() : null;
const gid = typeof process.getgid === "function" ? process.getgid() : null;

const targets = ["backend/dist", "frontend/.next"].map((relativePath) => ({
  relativePath,
  absolutePath: path.join(projectRoot, relativePath),
}));

function exists(targetPath) {
  return fs.existsSync(targetPath);
}

function isWritable(targetPath) {
  try {
    fs.accessSync(targetPath, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function ensureDirectory(targetPath) {
  if (!exists(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
  }
}

for (const target of targets) {
  ensureDirectory(target.absolutePath);
}

const blockedTargets = targets.filter((target) => !isWritable(target.absolutePath));

if (blockedTargets.length === 0) {
  console.log("[build-perms] Nenhum ajuste necessario.");
  process.exit(0);
}

if (uid === null || gid === null) {
  console.error(
    "[build-perms] Nao foi possivel detectar UID/GID para ajustar as permissoes automaticamente."
  );
  process.exit(1);
}

function hasDocker() {
  try {
    execSync("docker --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

if (!hasDocker()) {
  console.error("[build-perms] Docker nao encontrado.");
  console.error(
    `[build-perms] Execute manualmente: sudo chown -R ${uid}:${gid} ${blockedTargets
      .map((target) => target.relativePath)
      .join(" ")}`
  );
  process.exit(1);
}

const dockerTargets = blockedTargets
  .map((target) => `/workspace/${target.relativePath}`)
  .join(" ");

try {
  execSync(
    `docker run --rm -v "${projectRoot}:/workspace" alpine sh -c "chown -R ${uid}:${gid} ${dockerTargets}"`,
    { stdio: "inherit" }
  );
} catch (error) {
  console.error("[build-perms] Falha ao corrigir permissoes via Docker.");
  console.error(
    `[build-perms] Execute manualmente: sudo chown -R ${uid}:${gid} ${blockedTargets
      .map((target) => target.relativePath)
      .join(" ")}`
  );
  process.exit(error.status || 1);
}

const stillBlocked = blockedTargets.filter((target) => !isWritable(target.absolutePath));

if (stillBlocked.length > 0) {
  console.error("[build-perms] Ainda existem diretorios sem permissao de escrita:");
  for (const target of stillBlocked) {
    console.error(` - ${target.relativePath}`);
  }
  process.exit(1);
}

console.log("[build-perms] Permissoes corrigidas com sucesso.");
