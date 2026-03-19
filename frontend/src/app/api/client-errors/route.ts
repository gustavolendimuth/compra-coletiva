import { NextRequest, NextResponse } from "next/server";

const MAX_FIELD_LENGTH = 4000;

function sanitizeString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .slice(0, MAX_FIELD_LENGTH);
}

function sanitizeMetadata(
  metadata: unknown
): Record<string, string | number | boolean | null> | undefined {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return undefined;
  }

  const entries = Object.entries(metadata as Record<string, unknown>).slice(0, 20);
  const normalized = entries.reduce<Record<string, string | number | boolean | null>>(
    (acc, [key, value]) => {
      const safeKey = sanitizeString(key);
      if (!safeKey) {
        return acc;
      }

      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean" ||
        value === null
      ) {
        acc[safeKey] =
          typeof value === "string" ? sanitizeString(value) ?? "" : value;
      }

      return acc;
    },
    {}
  );

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const payload = {
      source: sanitizeString(body?.source) ?? "unknown",
      message: sanitizeString(body?.message) ?? "Unknown client error",
      stack: sanitizeString(body?.stack),
      componentStack: sanitizeString(body?.componentStack),
      digest: sanitizeString(body?.digest),
      pathname: sanitizeString(body?.pathname),
      userAgent: sanitizeString(body?.userAgent),
      timestamp: sanitizeString(body?.timestamp) ?? new Date().toISOString(),
      metadata: sanitizeMetadata(body?.metadata),
    };

    console.error("[client-error-report]", payload);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
