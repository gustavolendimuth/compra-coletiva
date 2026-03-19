"use client";

import { useEffect } from "react";
import Link from "next/link";
import { reportClientError } from "@/lib/clientErrorReporting";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void reportClientError({
      source: "next-global-error-boundary",
      message: error.message || "Unhandled Next.js global error",
      stack: error.stack,
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <main className="min-h-screen bg-cream-50 text-sky-900 px-4 py-8 flex items-center justify-center">
          <section className="w-full max-w-lg rounded-3xl bg-white border border-sky-100 shadow-md p-6 sm:p-8">
            <h1 className="font-display text-2xl text-sky-950">Falha na aplicacao</h1>
            <p className="mt-3 text-sm sm:text-base text-sky-800/80">
              Ocorreu um erro inesperado e ja registramos detalhes para analise.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => reset()}
                className="inline-flex items-center justify-center rounded-xl bg-sky-600 text-white px-4 py-2.5 text-sm font-semibold hover:bg-sky-700 transition-colors"
              >
                Tentar novamente
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl border border-sky-200 text-sky-800 px-4 py-2.5 text-sm font-semibold hover:bg-sky-50 transition-colors"
              >
                Ir para a home
              </Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
