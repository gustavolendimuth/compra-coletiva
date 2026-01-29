/**
 * Utilitário para cálculo de distância geográfica usando a fórmula de Haversine.
 * Calcula a distância em linha reta entre dois pontos na superfície da Terra.
 */

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calcula a distância em km entre dois pontos geográficos usando Haversine.
 * @returns Distância em quilômetros
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_KM * c * 10) / 10; // 1 casa decimal
}

/**
 * Calcula um bounding box (retângulo) em coordenadas ao redor de um ponto.
 * Usado para filtrar candidatos antes do cálculo preciso de Haversine.
 */
export function getBoundingBox(
  lat: number,
  lon: number,
  distanceKm: number
): {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
} {
  const latDelta = distanceKm / 111.32;
  const lonDelta = distanceKm / (111.32 * Math.cos(toRadians(lat)));

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLon: lon - lonDelta,
    maxLon: lon + lonDelta,
  };
}
