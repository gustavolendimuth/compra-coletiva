#!/usr/bin/env bash
# Confere, na imagem do backend, que o upload local grava em UPLOAD_DIR como usuário não-root.
# Uso: bash scripts/checks/container-upload.check.sh <image-tag>
set -euo pipefail

IMAGE="${1:?image tag}"
VOLUME="sec-lane-auth-upload-check-$$"

PROBE='
const fs = require("fs");
const path = require("path");
const { ImageUploadService } = require("/app/dist/services/imageUploadService");
const png = Buffer.concat([
  Buffer.from("89504e470d0a1a0a0000000d49484452", "hex"),
  Buffer.alloc(64),
]);
ImageUploadService.uploadImage({ buffer: png }, "probe")
  .then((result) => {
    const base = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
    const written = path.join(base, result.imageKey);
    if (result.storageType !== "LOCAL" || !fs.existsSync(written)) {
      console.error("not written", written);
      process.exit(2);
    }
    console.log("uid", process.getuid(), "wrote", written);
  })
  .catch((error) => {
    console.error("upload failed:", error.message);
    process.exit(1);
  });
'

cleanup() { docker volume rm -f "$VOLUME" >/dev/null 2>&1 || true; }
trap cleanup EXIT

echo "== UPLOAD_DIR padrão (/app/uploads)"
docker run --rm --entrypoint node "$IMAGE" -e "$PROBE"

echo "== UPLOAD_DIR=/app/data com volume montado"
docker volume create "$VOLUME" >/dev/null
docker run --rm --entrypoint node -e UPLOAD_DIR=/app/data -v "$VOLUME:/app/data" "$IMAGE" -e "$PROBE"
