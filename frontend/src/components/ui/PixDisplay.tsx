import { Copy, Check } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { PixKeyType } from "@/api";

interface PixDisplayProps {
  pixKey: string;
  pixType: PixKeyType;
  pixName?: string;
  className?: string;
}

const pixTypeLabels: Record<PixKeyType, string> = {
  CPF: "CPF",
  CNPJ: "CNPJ",
  EMAIL: "E-mail",
  PHONE: "Telefone",
  RANDOM: "Chave Aleatória",
};

export function PixDisplay({ pixKey, pixType, pixName, className = "" }: PixDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pixKey);
      setCopied(true);
      toast.success("Chave PIX copiada!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Erro ao copiar chave PIX");
    }
  };

  return (
    <div
      className={`bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-lg p-4 md:p-6 ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-green-600 text-white px-2.5 py-0.5 rounded-full text-xs font-semibold">
              PIX
            </div>
            <span className="text-sm text-green-700 font-medium">
              {pixTypeLabels[pixType]}
            </span>
          </div>

          {pixName && (
            <p className="text-sm text-gray-700 mb-2">
              <span className="font-medium">Titular:</span> {pixName}
            </p>
          )}

          <div className="bg-white border border-green-200 rounded-lg p-3 break-all">
            <p className="text-base md:text-lg font-mono text-gray-900">
              {pixKey}
            </p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="flex-shrink-0 p-2 md:p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="Copiar chave PIX"
        >
          {copied ? (
            <Check className="w-5 h-5 md:w-6 md:h-6" />
          ) : (
            <Copy className="w-5 h-5 md:w-6 md:h-6" />
          )}
        </button>
      </div>

      <p className="text-xs md:text-sm text-green-700 mt-3 flex items-start gap-1.5">
        <span className="font-medium">💡</span>
        <span>
          Use esta chave PIX para realizar o pagamento. Após pagar, aguarde a confirmação do vendedor.
        </span>
      </p>
    </div>
  );
}
