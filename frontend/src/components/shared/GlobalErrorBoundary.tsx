"use client";

import React from "react";
import Link from "next/link";
import { reportClientError } from "@/lib/clientErrorReporting";

interface GlobalErrorBoundaryProps {
  children: React.ReactNode;
}

interface GlobalErrorBoundaryState {
  hasError: boolean;
}

export class GlobalErrorBoundary extends React.Component<
  GlobalErrorBoundaryProps,
  GlobalErrorBoundaryState
> {
  public state: GlobalErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(): GlobalErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    void reportClientError({
      source: "react-error-boundary",
      message: error.message || "Unhandled React runtime error",
      stack: error.stack,
      componentStack: errorInfo.componentStack || undefined,
    });
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  public render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="min-h-screen bg-cream-50 text-sky-900 px-4 py-8 flex items-center justify-center">
        <section className="w-full max-w-lg rounded-3xl bg-white border border-sky-100 shadow-md p-6 sm:p-8">
          <h1 className="font-display text-2xl text-sky-950">Algo deu errado</h1>
          <p className="mt-3 text-sm sm:text-base text-sky-800/80">
            Ocorreu um erro inesperado ao carregar esta tela. Voce pode tentar
            novamente agora.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={this.handleRetry}
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
    );
  }
}
