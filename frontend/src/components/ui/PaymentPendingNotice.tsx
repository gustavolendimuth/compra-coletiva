import { Clock, CreditCard, Truck, Lock } from "lucide-react";

type PaymentReleaseTrigger = "ON_ACTIVE" | "ON_CLOSED" | "ON_SENT" | "ON_SHIPPING_UPDATED";

interface PaymentPendingNoticeProps {
  paymentReleaseTrigger: PaymentReleaseTrigger;
  campaignStatus: string;
  className?: string;
}

const triggerConfig: Record<PaymentReleaseTrigger, {
  message: string;
  detail: string;
  icon: typeof Clock;
}> = {
  ON_ACTIVE: {
    message: "O pagamento via PIX estará disponível em breve",
    detail: "O organizador está preparando a liberação do pagamento.",
    icon: CreditCard,
  },
  ON_CLOSED: {
    message: "O pagamento será liberado quando a campanha for fechada",
    detail: "Assim que o organizador fechar as inscrições, você receberá um aviso por e-mail para realizar o pagamento via PIX.",
    icon: Lock,
  },
  ON_SENT: {
    message: "O pagamento será liberado quando os pedidos forem enviados",
    detail: "Assim que o organizador confirmar o envio, você receberá um aviso por e-mail para realizar o pagamento via PIX.",
    icon: Truck,
  },
  ON_SHIPPING_UPDATED: {
    message: "O pagamento será liberado quando o frete for definido",
    detail: "O valor do frete ainda está sendo negociado com o fornecedor. Você receberá um aviso por e-mail assim que o pagamento for liberado.",
    icon: Truck,
  },
};

export function PaymentPendingNotice({
  paymentReleaseTrigger,
  campaignStatus,
  className = "",
}: PaymentPendingNoticeProps) {
  const config = triggerConfig[paymentReleaseTrigger];
  const Icon = config.icon;

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-sky-50 via-sky-50 to-blue-100 border border-sky-200 rounded-lg p-4 md:p-5 ${className}`}
    >
      {/* Decorative background pattern */}
      <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.04]">
        <svg viewBox="0 0 80 80" fill="currentColor" className="w-full h-full text-sky-900">
          <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="2" fill="none" />
          <path d="M40 16 V40 H56" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
      </div>

      <div className="relative flex items-start gap-3">
        {/* Icon container */}
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center">
          <Icon className="w-5 h-5 text-sky-600" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header with badge */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center bg-sky-600 text-white px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase">
              PIX
            </span>
            <span className="text-xs text-sky-500 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Aguardando liberação
            </span>
          </div>

          {/* Main message */}
          <p className="text-sm font-semibold text-sky-900 mb-1">
            {config.message}
          </p>

          {/* Detail */}
          <p className="text-xs text-sky-600/80 leading-relaxed">
            {config.detail}
          </p>
        </div>
      </div>
    </div>
  );
}
