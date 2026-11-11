"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/clientErrorReporting";

export function ClientErrorListener() {
  useEffect(() => {
    const handleWindowError = (event: ErrorEvent) => {
      void reportClientError({
        source: "window-error",
        message: event.message || "Unhandled window error",
        stack:
          event.error instanceof Error ? event.error.stack : undefined,
        metadata: {
          filename: event.filename || "",
          line: event.lineno || 0,
          column: event.colno || 0,
        },
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : "Unhandled promise rejection";

      void reportClientError({
        source: "unhandled-rejection",
        message,
        stack: reason instanceof Error ? reason.stack : undefined,
      });
    };

    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}
