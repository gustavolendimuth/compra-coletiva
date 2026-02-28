import { useState, useEffect, useCallback } from 'react';
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
  const [routePath, setRoutePath] = useState<Array<[number, number]> | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [customCep, setCustomCep] = useState('');
  const [fromCoords, setFromCoords] = useState<[number, number] | null>(null);

  const hasLocation = campaign.pickupLatitude != null && campaign.pickupLongitude != null;
  const hasAddress = campaign.pickupAddress;

  const calculateDistance = useCallback(async (zipCode: string) => {
    if (!campaign.slug) return;
    setIsCalculating(true);
    try {
      const result = await campaignService.getDistance(campaign.slug, { zipCode });
      setDistanceKm(result.distanceKm);
      setFromCoords([result.from.latitude, result.from.longitude]);
      setRoutePath(result.route?.coordinates || null);
    } catch {
      // Silently fail
      setRoutePath(null);
    } finally {
      setIsCalculating(false);
    }
  }, [campaign.slug]);

  const calculateDistanceFromCoords = useCallback(async (lat: number, lng: number) => {
    if (campaign.pickupLatitude == null || campaign.pickupLongitude == null) return;
    setIsCalculating(true);
    try {
      const result = await campaignService.getDistance(campaign.slug, {
        coords: { lat, lng },
      });
      setDistanceKm(result.distanceKm);
      setFromCoords([result.from.latitude, result.from.longitude]);
      setRoutePath(result.route?.coordinates || null);
      return;
    } catch {
      // Fallback to straight-line distance if routing fails
      setRoutePath(null);
      const R = 6371;
      const dLat = (campaign.pickupLatitude - lat) * Math.PI / 180;
      const dLon = (campaign.pickupLongitude - lng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * Math.PI / 180) * Math.cos(campaign.pickupLatitude * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      setDistanceKm(Math.round(R * c * 10) / 10);
      setFromCoords([lat, lng]);
    } finally {
      setIsCalculating(false);
    }
  }, [campaign.pickupLatitude, campaign.pickupLongitude, campaign.slug]);

  // Auto-calculate from user's saved address
  useEffect(() => {
    if (!hasLocation) return;

    if (user?.defaultLatitude != null && user?.defaultLongitude != null) {
      void calculateDistanceFromCoords(user.defaultLatitude, user.defaultLongitude);
      return;
    }

    if (user?.defaultZipCode) {
      void calculateDistance(user.defaultZipCode);
    }
  }, [
    calculateDistance,
    calculateDistanceFromCoords,
    hasLocation,
    user?.defaultLatitude,
    user?.defaultLongitude,
    user?.defaultZipCode,
  ]);

  const handleCustomSearch = () => {
    const digits = customCep.replace(/\D/g, '');
    if (digits.length === 8) {
      calculateDistance(digits);
    }
  };

  const handleUseMyAddress = () => {
    if (user?.defaultLatitude != null && user?.defaultLongitude != null) {
      void calculateDistanceFromCoords(user.defaultLatitude, user.defaultLongitude);
      setCustomCep('');
      return;
    }

    if (user?.defaultZipCode) {
      void calculateDistance(user.defaultZipCode);
      setCustomCep('');
    }
  };

  if (!hasAddress) {
    if (!canEditCampaign || !onEditAddress) {
      return null;
    }
    return (
      <div className="bg-white border border-sky-100 rounded-2xl shadow-sm p-4 md:p-6">
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-sm text-sky-600 mb-4">
            Adicione um endereço de retirada para que os compradores saibam onde buscar os produtos.
          </p>
          <button
            onClick={onEditAddress}
            className="px-6 py-2 bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-2xl text-sm font-medium shadow-sm shadow-sky-300/30 hover:shadow-md hover:shadow-sky-300/40 transition-all min-h-[44px]"
          >
            Adicionar Endereço de Retirada
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-sky-100 rounded-2xl shadow-sm p-4 md:p-6">
      <h3 className="font-display text-lg md:text-xl font-semibold text-sky-900 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Local de Retirada
        {distanceKm !== null && <DistanceBadge distanceKm={distanceKm} />}
        {canEditCampaign && onEditAddress && (
          <button
            onClick={onEditAddress}
            className="ml-auto text-sm text-sky-600 hover:text-sky-800 font-medium min-h-[44px] px-2 transition-colors"
          >
            Editar
          </button>
        )}
      </h3>

      {/* Address */}
      <div className="text-sm md:text-base text-sky-800/80 mb-4">
        <p className="font-medium">
          {campaign.pickupAddress}, {campaign.pickupAddressNumber}
          {campaign.pickupComplement && ` - ${campaign.pickupComplement}`}
        </p>
        <p className="text-sky-600">
          {campaign.pickupNeighborhood && `${campaign.pickupNeighborhood} - `}
          {campaign.pickupCity} - {campaign.pickupState}
        </p>
        <p className="text-sky-500 text-xs mt-1">CEP: {campaign.pickupZipCode}</p>
      </div>

      {/* Map */}
      {hasLocation && (
        <div className="mb-4">
          <CampaignLocationMap
            pickupCoords={[campaign.pickupLatitude!, campaign.pickupLongitude!]}
            pickupLabel={`${campaign.pickupAddress}, ${campaign.pickupAddressNumber}`}
            fromCoords={fromCoords}
            routePath={routePath || undefined}
          />
        </div>
      )}

      {/* Distance calculator */}
      {hasLocation && (
        <div className="border-t border-sky-100 pt-4">
          <p className="text-sm text-sky-600 mb-2">Calcular distância de outro local:</p>
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
              className="px-4 py-2 bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-2xl hover:shadow-md hover:shadow-sky-300/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm min-h-[44px] transition-all"
            >
              {isCalculating ? '...' : 'Calcular'}
            </button>
          </div>
          {(user?.defaultZipCode || (user?.defaultLatitude != null && user?.defaultLongitude != null)) && customCep && (
            <button
              onClick={handleUseMyAddress}
              className="mt-2 text-xs text-sky-600 hover:text-sky-800 underline transition-colors"
            >
              Usar meu endereço salvo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
