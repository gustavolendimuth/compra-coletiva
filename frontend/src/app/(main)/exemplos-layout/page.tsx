import type { Metadata } from "next";
import { LayoutExamplesShowcase } from "@/components/features/layout-examples/LayoutExamplesShowcase";

export const metadata: Metadata = {
  title: "Exemplos de Layout",
  description: "Tres propostas visuais para novas evolucoes de layout do Compra Coletiva.",
};

export default function LayoutExamplesPage() {
  return <LayoutExamplesShowcase />;
}
