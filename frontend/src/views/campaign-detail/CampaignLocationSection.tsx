import { useState, useEffect } from 'react';
import { CepInput } from '@/components/ui/CepInput';
import { DistanceBadge } from '@/components/ui/DistanceBadge';
import { CampaignLocationMap } from './CampaignLocationMap';
import { campaignService } from '@/api';
import { useAuth } from '@/contexts/AuthContext';

interface CampaignLocationSectionProps {
  campaign: {
    id: string;
    slug: string;
    pickupZipCode?: string | null;
    pickupAddress?: string | null;
    pickupAddressNumber?: string | null;
    pickupComplement?: string | null;
    pickupNeighborhood?: string | null;
    pickupCity?: string | null;
    pickupState?: string | null;
    pickupLatitude?: number | null;
    pickupLongitude?: number | null;
  };
  canEditCampaign?: boolean;
  onEditAddress?: () => void;
}

export function CampaignLocationSection({ campaign, canEditCampaign, onEditAddress }: CampaignLocationSectionProps) {
  const { user } = useAuth();
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [customCep, setCustomCep] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [fromCoords, setFromCoords] = useState<[number, number] | null>(null);

  const hasLocation = campaign.pickupLatitude && campaign.pickupLongitude;
  const hasAddress = campaign.pickupAddress;

  // Auto-calculate from user's saved address
  useEffect(() => {
    if (user?.defaultLatitude && user?.defaultLongitude && hasLocation) {
      calculateDistanceFromCoords(
        user.defaultLatitude,
        user.defaultLongitude
      );
    }
  }, []);

  async function calculateDistance(zipCode: string) {
    if (!campaign.slug) return;
    setIsCalculating(true);
    try {
      const result = await campaignService.getDistance(campaign.slug, zipCode);
      setDistanceKm(result.distanceKm);
      setFromCoords([result.from.latitude, result.from.longitude]);
    } catch {
      // Silently fail
    } finally {
      setIsCalculating(false);
    }
  }

  function calculateDistanceFromCoords(lat: number, lng: number) {
    if (!campaign.pickupLatitude || !campaign.pickupLongitude) return;
    // Simple Haversine in frontend for immediate display
    const R = 6371;
    const dLat = (campaign.pickupLatitude - lat) * Math.PI / 180;
    const dLon = (campaign.pickupLongitude - lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * Math.PI / 180) * Math.cos(campaign.pickupLatitude * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    setDistanceKm(Math.round(R * c * 10) / 10);
    setFromCoords([lat, lng]);
  }

  const handleCustomSearch = () => {
    const digits = customCep.replace(/\D/g, '');
    if (digits.length === 8) {
      calculateDistance(digits);
    }
  };

  const handleUseMyAddress = () => {
    if (user?.defaultLatitude && user?.defaultLongitude) {
      calculateDistanceFromCoords(user.defaultLatitude, user.defaultLongitude);
      setCustomCep('');
    }
  };

  const copyAddress = () => {
    const full = [
      campaign.pickupAddress,
      campaign.pickupAddressNumber,
      campaign.pickupComplement,
      campaign.pickupNeighborhood,
      `${campaign.pickupCity} - ${campaign.pickupState}`,
      campaign.pickupZipCode,
    ].filter(Boolean).join(', ');
    navigator.clipboard.writeText(full);
  };

  if (!hasAddress) {
    if (!canEditCampaign || !onEditAddress) {
      return null;
    }
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 md:p-6">
        <div className="text-center py-4">
          <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm text-gray-600 mb-4">
            Adicione um endereço de retirada para que os compradores saibam onde buscar os produtos.
          </p>
          <button
            onClick={onEditAddress}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium min-h-[44px]"
          >
            Adicionar Endereço de Retirada
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 md:p-6">
      <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Local de Retirada
        {distanceKm !== null && <DistanceBadge distanceKm={distanceKm} />}
        {canEditCampaign && onEditAddress && (
          <button
            onClick={onEditAddress}
            className="ml-auto text-sm text-blue-600 hover:text-blue-700 font-medium min-h-[44px] px-2"
          >
            Editar
          </button>
        )}
      </h3>

      {/* Address */}
      <div className="text-sm md:text-base text-gray-700 mb-4">
        <p className="font-medium">
          {campaign.pickupAddress}, {campaign.pickupAddressNumber}
          {campaign.pickupComplement && ` - ${campaign.pickupComplement}`}
        </p>
        <p className="text-gray-500">
          {campaign.pickupNeighborhood && `${campaign.pickupNeighborhood} - `}
          {campaign.pickupCity} - {campaign.pickupState}
        </p>
        <p className="text-gray-400 text-xs mt-1">CEP: {campaign.pickupZipCode}</p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {hasLocation && (
          <button
            onClick={() => setShowMap(!showMap)}
            className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 min-h-[44px]"
          >
            {showMap ? 'Ocultar mapa' : 'Ver no mapa'}
          </button>
        )}
        <button
          onClick={copyAddress}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 min-h-[44px]"
        >
          Copiar endereço
        </button>
      </div>

      {/* Map */}
      {showMap && hasLocation && (
        <div className="mb-4">
          <CampaignLocationMap
            pickupCoords={[campaign.pickupLatitude!, campaign.pickupLongitude!]}
            pickupLabel={`${campaign.pickupAddress}, ${campaign.pickupAddressNumber}`}
            fromCoords={fromCoords}
          />
        </div>
      )}

      {/* Distance calculator */}
      {hasLocation && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-600 mb-2">Calcular distância de outro local:</p>
          <div className="flex gap-2">
            <div className="flex-1">
              <CepInput
                value={customCep}
                onChange={setCustomCep}
                label=""
              />
            </div>
            <button
              onClick={handleCustomSearch}
              disabled={customCep.replace(/\D/g, '').length !== 8 || isCalculating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 text-sm min-h-[44px]"
            >
              {isCalculating ? '...' : 'Calcular'}
            </button>
          </div>
          {user?.defaultLatitude && customCep && (
            <button
              onClick={handleUseMyAddress}
              className="mt-2 text-xs text-blue-600 hover:text-blue-700 underline"
            >
              Usar meu endereço salvo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
