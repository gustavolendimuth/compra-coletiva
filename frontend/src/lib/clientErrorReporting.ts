"use client";

export type ClientErrorSource =
  | "react-error-boundary"
  | "next-error-boundary"
  | "next-global-error-boundary"
  | "window-error"
  | "unhandled-rejection";

export interface ClientErrorReport {
  source: ClientErrorSource;
  message: string;
  stack?: string;
  componentStack?: string;
  digest?: string;
  metadata?: Record<string, unknown>;
}

const REPORT_ENDPOINT = "/api/client-errors";

function createPayload(report: ClientErrorReport) {
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : undefined;
  const userAgent =
    typeof navigator !== "undefined" ? navigator.userAgent : undefined;

  return {
    ...report,
    pathname,
    userAgent,
    timestamp: new Date().toISOString(),
  };
}

export async function reportClientError(report: ClientErrorReport): Promise<void> {
  const payload = createPayload(report);

  console.error("[client-error]", payload);

  try {
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.sendBeacon === "function"
    ) {
      const body = new Blob([JSON.stringify(payload)], {
        type: "application/json",
      });
      navigator.sendBeacon(REPORT_ENDPOINT, body);
      return;
    }

    if (typeof fetch === "function") {
      await fetch(REPORT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        keepalive: true,
      });
    }
  } catch {
    // Avoid cascading failures while handling runtime errors.
  }
}
