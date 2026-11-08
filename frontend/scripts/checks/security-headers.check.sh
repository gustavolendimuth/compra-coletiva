#!/usr/bin/env bash
# Confere headers de segurança das páginas e o 400 do /_next/image para host externo.
# Uso: bash scripts/checks/security-headers.check.sh http://localhost:5391
set -uo pipefail

BASE_URL="${1:?base url}"
fail=0

expect_header() {
  local headers="$1" name="$2" expected="$3" path="$4"
  local value
  value="$(printf '%s' "$headers" | grep -i "^${name}:" | head -1 | cut -d: -f2- | sed 's/^ *//' | tr -d '\r')"
  if [[ "$value" != *"$expected"* ]]; then
    echo "FAIL ${path}: ${name} = '${value}' (esperado conter '${expected}')"
    fail=1
  else
    echo "ok   ${path}: ${name} contém '${expected}'"
  fi
}

for path in / /campanhas; do
  headers="$(curl -s -o /dev/null -D - "${BASE_URL}${path}")"
  expect_header "$headers" "Content-Security-Policy" "frame-ancestors 'none'" "$path"
  expect_header "$headers" "Content-Security-Policy" "object-src 'none'" "$path"
  expect_header "$headers" "Content-Security-Policy" "base-uri 'self'" "$path"
  expect_header "$headers" "X-Content-Type-Options" "nosniff" "$path"
  expect_header "$headers" "Referrer-Policy" "strict-origin-when-cross-origin" "$path"
  expect_header "$headers" "Strict-Transport-Security" "max-age=31536000; includeSubDomains" "$path"
done

status="$(curl -s -o /dev/null -w '%{http_code}' "${BASE_URL}/_next/image?url=https://exemplo-externo.com/x.png&w=64&q=75")"
if [[ "$status" != "400" ]]; then
  echo "FAIL /_next/image externo: status ${status} (esperado 400)"
  fail=1
else
  echo "ok   /_next/image externo: 400"
fi

exit "$fail"
