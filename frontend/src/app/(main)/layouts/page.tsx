import Link from "next/link";
import { ExternalLink } from "lucide-react";

const layoutFiles = [
  {
    title: "Layout 1 - Mercado Vivo",
    description: "Direcao editorial organica com destaque para descoberta de campanhas.",
    href: "/layouts/layout-1-mercado-vivo.html",
  },
  {
    title: "Layout 2 - Ultra Moderno",
    description: "Estetica operacional de alto contraste para monitoramento em tempo real.",
    href: "/layouts/layout-2-ultra-moderno.html",
  },
  {
    title: "Layout 3 - Minimalista Verde",
    description: "Visual limpo com foco em confianca e fluxo de conversao.",
    href: "/layouts/layout-3-minimalista-verde.html",
  },
];

export default function LayoutsGalleryPage() {
  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-gray-50 to-green-50 p-5 shadow-md sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
          Galeria de layouts
        </p>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
          3 propostas para abrir no navegador
        </h1>
        <p className="mt-2 text-sm text-gray-700 sm:text-base">
          Clique em qualquer layout para abrir em tela cheia.
        </p>
      </header>

      <section className="grid gap-4">
        {layoutFiles.map((layout) => (
          <article
            key={layout.href}
            className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{layout.title}</h2>
                <p className="mt-1 text-sm text-gray-600">{layout.description}</p>
              </div>
              <Link
                href={layout.href}
                target="_blank"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                Abrir layout
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
              <iframe
                title={layout.title}
                src={layout.href}
                className="h-[360px] w-full bg-white"
                loading="lazy"
              />
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
