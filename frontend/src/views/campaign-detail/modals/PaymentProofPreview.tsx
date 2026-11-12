/* eslint-disable @next/next/no-img-element */
import { FileText, ExternalLink, Loader } from "lucide-react";
import { usePaymentProofFile } from "@/hooks/usePaymentProofFile";

interface PaymentProofPreviewProps {
  orderId: string;
}

/**
 * Exibe o comprovante carregado pelo endpoint autenticado (nunca por URL pública)
 */
export function PaymentProofPreview({ orderId }: PaymentProofPreviewProps) {
  const { url, kind, isLoading, isUnavailable } = usePaymentProofFile(orderId, true);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader className="w-4 h-4 animate-spin" />
        Carregando comprovante...
      </div>
    );
  }

  if (isUnavailable || !url) {
    return <p className="text-sm text-gray-500">Não foi possível exibir o comprovante.</p>;
  }

  if (kind === "pdf") {
    return (
      <div className="border rounded-lg overflow-hidden bg-gray-50">
        <iframe src={url} title="Comprovante PIX" className="w-full h-96" />
        <div className="p-3 border-t flex items-center gap-2">
          <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-sky-600 hover:underline flex items-center gap-1"
          >
            Abrir PDF em nova aba
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <img src={url} alt="Comprovante PIX" className="w-full h-auto" />
    </div>
  );
}
