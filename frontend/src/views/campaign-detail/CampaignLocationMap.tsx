import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with Leaflet
const Map = dynamic(
  () => import('@/components/ui/Map').then((mod) => ({ default: mod.Map })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[200px] md:h-[300px] w-full rounded-lg bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Carregando mapa...</p>
      </div>
    )
  }
);

interface CampaignLocationMapProps {
  pickupCoords: [number, number];
  pickupLabel?: string;
  fromCoords?: [number, number] | null;
}

export function CampaignLocationMap({
  pickupCoords,
  pickupLabel = 'Local de retirada',
  fromCoords,
}: CampaignLocationMapProps) {
  const markers = [
    { position: pickupCoords, popup: pickupLabel },
  ];

  if (fromCoords) {
    markers.push({
      position: fromCoords,
      popup: 'Seu endereço',
    });
  }

  return (
    <Map
      center={pickupCoords}
      zoom={fromCoords ? 12 : 15}
      markers={markers}
      showRoute={fromCoords ? { from: fromCoords, to: pickupCoords } : undefined}
    />
  );
}
