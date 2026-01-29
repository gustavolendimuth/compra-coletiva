import { Map } from '@/components/ui/Map';

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
