import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with Leaflet
const Map = dynamic(
  () => import("@/components/ui/Map").then((mod) => ({ default: mod.Map })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[260px] sm:h-[320px] md:h-[380px] lg:h-[420px] w-full rounded-lg bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Carregando mapa...</p>
      </div>
    ),
  }
);

interface CampaignLocationMapProps {
  pickupCoords: [number, number];
  pickupLabel?: string;
  fromCoords?: [number, number] | null;
}

export function CampaignLocationMap({
  pickupCoords,
  pickupLabel = "Local de retirada",
  fromCoords,
}: CampaignLocationMapProps) {
  const markers: Array<{
    position: [number, number];
    popup: string;
    color: "blue" | "green";
  }> = [{ position: pickupCoords, popup: pickupLabel, color: "blue" }];

  if (fromCoords) {
    markers.push({
      position: fromCoords,
      popup: "Seu endereço",
      color: "green",
    });
  }

  return (
    <Map
      center={pickupCoords}
      zoom={fromCoords ? 12 : 15}
      markers={markers}
      showRoute={fromCoords ? { from: fromCoords, to: pickupCoords } : undefined}
      className="h-[260px] sm:h-[320px] md:h-[380px] lg:h-[420px]"
    />
  );
}
