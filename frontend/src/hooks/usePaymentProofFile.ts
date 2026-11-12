import { useEffect, useState } from "react";
import { orderApi } from "@/api";

export type PaymentProofKind = "image" | "pdf";

interface PaymentProofFileState {
  url: string | null;
  kind: PaymentProofKind | null;
  isLoading: boolean;
  isUnavailable: boolean;
}

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function kindFromType(type: string): PaymentProofKind | null {
  const normalized = type.split(";")[0].trim().toLowerCase();
  if (normalized === "application/pdf") return "pdf";
  if (IMAGE_TYPES.has(normalized)) return "image";
  return null;
}

/**
 * Carrega o comprovante pelo endpoint autenticado e expõe um object URL local.
 * Só imagem (JPEG/PNG/WebP) ou PDF são exibidos; qualquer outro tipo fica indisponível.
 */
export function usePaymentProofFile(orderId: string | undefined, enabled: boolean): PaymentProofFileState {
  const [state, setState] = useState<PaymentProofFileState>({
    url: null,
    kind: null,
    isLoading: false,
    isUnavailable: false,
  });

  useEffect(() => {
    if (!orderId || !enabled) {
      setState({ url: null, kind: null, isLoading: false, isUnavailable: false });
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;
    setState({ url: null, kind: null, isLoading: true, isUnavailable: false });

    orderApi
      .getPaymentProof(orderId)
      .then((blob) => {
        if (cancelled) return;
        const kind = kindFromType(blob.type);
        if (!kind) {
          setState({ url: null, kind: null, isLoading: false, isUnavailable: true });
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setState({ url: objectUrl, kind, isLoading: false, isUnavailable: false });
      })
      .catch(() => {
        if (!cancelled) {
          setState({ url: null, kind: null, isLoading: false, isUnavailable: true });
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [orderId, enabled]);

  return state;
}
