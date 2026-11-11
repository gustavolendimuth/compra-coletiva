import { Bebas_Neue, Merriweather, Syne } from "next/font/google";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  MapPin,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";
import styles from "./LayoutExamplesShowcase.module.css";

const displayFont = Bebas_Neue({ subsets: ["latin"], weight: "400" });
const serifFont = Merriweather({ subsets: ["latin"], weight: ["400", "700"] });
const techFont = Syne({ subsets: ["latin"], weight: ["500", "700"] });

const editorialCards = [
  {
    title: "Hortifruti Zona Norte",
    location: "5.2 km",
    orders: "31 pedidos",
    freight: "Frete medio R$ 7,90",
  },
  {
    title: "Casa e Limpeza Coletiva",
    location: "2.8 km",
    orders: "42 pedidos",
    freight: "Frete medio R$ 6,10",
  },
  {
    title: "Mercado da Semana",
    location: "7.1 km",
    orders: "18 pedidos",
    freight: "Frete medio R$ 9,40",
  },
];

const controlBlocks = [
  { title: "Separacao em andamento", value: "16 lotes", tone: "blue" },
  { title: "Entregas no prazo", value: "94%", tone: "green" },
  { title: "Pendencias criticas", value: "03 alertas", tone: "red" },
] as const;

const spotlightStats = [
  { label: "Participantes ativos", value: "1.248" },
  { label: "Economia media", value: "23%" },
  { label: "Campanhas finalizadas", value: "410" },
];

const toneClasses = {
  blue: "border-blue-200 bg-blue-50 text-blue-800",
  green: "border-green-200 bg-green-50 text-green-800",
  red: "border-red-200 bg-red-50 text-red-800",
};

export function LayoutExamplesShowcase() {
  return (
    <div className={`relative space-y-8 md:space-y-10 ${styles.showcase}`}>
      <section
        className={`${styles.sectionFrame} rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 via-gray-50 to-green-50 p-5 shadow-md sm:p-6`}
      >
        <div className={`absolute inset-0 ${styles.meshBlue}`} />
        <div className="relative z-10 space-y-5">
          <div className="space-y-3">
            <p className={`${techFont.className} text-xs uppercase tracking-[0.24em] text-blue-700`}>
              Layout 01 | Editorial em camadas
            </p>
            <h2 className={`${displayFont.className} text-4xl leading-none text-blue-900 sm:text-5xl`}>
              Catalogo narrativo para campanhas locais
            </h2>
            <p className={`${serifFont.className} max-w-xl text-base text-gray-700 sm:text-lg`}>
              Estrutura pensada para descoberta: cards com foco em distancia, volume e contexto
              de frete, com destaque visual para leitura rapida no mobile.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {editorialCards.map((card, index) => {
              const delayClass = [styles.delay1, styles.delay2, styles.delay3][index] || "";
              return (
                <article
                  key={card.title}
                  className={`${styles.reveal} ${delayClass} rounded-2xl border border-blue-100 bg-white/90 p-4 shadow-sm`}
                >
                  <p className={`${techFont.className} text-sm text-blue-700`}>{card.title}</p>
                  <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-green-600" />
                      {card.location}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-4 w-4 text-blue-600" />
                      {card.orders}
                    </span>
                  </div>
                  <p className="mt-4 text-sm text-gray-700">{card.freight}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section
        className={`${styles.sectionFrame} rounded-3xl border border-gray-300 bg-gradient-to-b from-gray-900 via-gray-800 to-blue-900 p-5 shadow-lg sm:p-6`}
      >
        <div className={`absolute inset-0 ${styles.meshNeutral}`} />
        <div className="relative z-10 space-y-5 text-gray-100">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className={`${techFont.className} text-xs uppercase tracking-[0.24em] text-green-300`}>
                Layout 02 | Painel operacional
              </p>
              <h2 className={`${displayFont.className} mt-1 text-4xl leading-none sm:text-5xl`}>
                Centro de controle de pedidos
              </h2>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full border border-blue-200 px-3 py-2 text-sm text-blue-100 transition-colors hover:border-blue-100 hover:bg-blue-800/60"
            >
              Abrir monitor ao vivo
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {controlBlocks.map((block, index) => {
              const delayClass = [styles.delay1, styles.delay2, styles.delay3][index] || "";
              return (
                <article
                  key={block.title}
                  className={`${styles.reveal} ${delayClass} rounded-xl border p-3 ${toneClasses[block.tone]}`}
                >
                  <p className="text-xs uppercase tracking-wide">{block.title}</p>
                  <p className={`${techFont.className} mt-2 text-2xl`}>{block.value}</p>
                </article>
              );
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-gray-600 bg-gray-900/70 p-4 shadow-md">
              <p className={`${techFont.className} text-sm text-gray-100`}>Linha do tempo da campanha</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-400" />
                  <p className="text-sm text-gray-200">Consolidacao de pedidos concluida as 09:18</p>
                </div>
                <div className="flex items-start gap-3">
                  <Truck className="mt-0.5 h-4 w-4 text-blue-300" />
                  <p className="text-sm text-gray-200">Roteiro de distribuicao atualizado para 4 bairros</p>
                </div>
                <div className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 h-4 w-4 text-red-300" />
                  <p className="text-sm text-gray-200">Janela de ajuste de frete fecha em 38 minutos</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-blue-700/60 bg-blue-950/50 p-4 shadow-md">
              <p className={`${techFont.className} text-sm text-blue-100`}>Saude da operacao</p>
              <div className="mt-4 space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-blue-100">
                    <span>Confirmacao</span>
                    <span>86%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-700">
                    <div className="h-full w-[86%] rounded-full bg-green-500" />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-blue-100">
                    <span>Pagamento</span>
                    <span>74%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-700">
                    <div className="h-full w-[74%] rounded-full bg-blue-500" />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-blue-100">
                    <span>Entrega</span>
                    <span>61%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-700">
                    <div className="h-full w-[61%] rounded-full bg-red-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className={`${styles.sectionFrame} rounded-3xl border border-green-200 bg-gradient-to-tr from-gray-100 via-green-50 to-blue-100 p-5 shadow-md sm:p-6`}
      >
        <div className={`absolute inset-0 ${styles.meshGreen}`} />
        <div className="relative z-10 grid gap-5 lg:grid-cols-[1.25fr_1fr] lg:items-end">
          <div className="space-y-3">
            <p className={`${techFont.className} text-xs uppercase tracking-[0.24em] text-green-700`}>
              Layout 03 | Vitrine colaborativa
            </p>
            <h2 className={`${displayFont.className} text-4xl leading-none text-gray-900 sm:text-5xl`}>
              Hero com ofertas, prova social e status de seguranca
            </h2>
            <p className={`${serifFont.className} max-w-lg text-base text-gray-700 sm:text-lg`}>
              Composicao assimetrica para converter no primeiro scroll: headline forte, estatisticas
              confiaveis e chamada de acao com contexto da comunidade.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-blue-800"
              >
                Iniciar campanha piloto
              </button>
              <button
                type="button"
                className="rounded-xl border border-green-500 bg-green-100 px-4 py-3 text-sm font-semibold text-green-800 shadow-sm hover:bg-green-200"
              >
                Ver roteiro de entrega
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-gray-300 bg-white/90 p-4 shadow-md">
              <p className={`${techFont.className} text-sm text-gray-900`}>Indicadores da semana</p>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {spotlightStats.map((item) => (
                  <div key={item.label} className="rounded-lg border border-gray-200 bg-gray-50 p-2">
                    <p className="text-xs text-gray-600">{item.label}</p>
                    <p className={`${techFont.className} mt-1 text-lg text-blue-800`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-green-300 bg-green-100/90 p-4 shadow">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-green-800">
                <ShieldCheck className="h-4 w-4" />
                Verificacao de organizadores ativa em tempo real
              </p>
              <p className="mt-2 text-sm text-green-900">
                Fluxo pronto para escalar para bairros com alto volume sem perder rastreabilidade.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
