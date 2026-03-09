import type { Metadata } from "next";
import { MercadoVivoHome } from "@/components/features/home-mercado-vivo/MercadoVivoHome";

export const metadata: Metadata = {
  title: "Compra Coletiva",
  description:
    "Compre junto, pague menos. Descubra campanhas reais de compra coletiva no seu bairro.",
};

export default function HomePage() {
  return <MercadoVivoHome />;
}
