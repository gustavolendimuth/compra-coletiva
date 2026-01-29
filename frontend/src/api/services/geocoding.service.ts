import { apiClient } from '../client';
import type { GeocodingResult } from '../types';

export const geocodingService = {
  /**
   * Busca endereço e coordenadas a partir de um CEP
   */
  getAddressByCep: (cep: string) =>
    apiClient
      .get<GeocodingResult>(`/geocoding/cep/${cep.replace(/\D/g, '')}`)
      .then((res) => res.data),

  /**
   * Busca coordenadas com endereço completo (CEP + número)
   */
  getCoordinatesByCep: (cep: string, number?: string) =>
    apiClient
      .get<GeocodingResult>(`/geocoding/cep/${cep.replace(/\D/g, '')}/coordinates`, {
        params: { number },
      })
      .then((res) => res.data),
};
