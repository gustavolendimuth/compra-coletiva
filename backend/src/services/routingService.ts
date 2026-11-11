/**
 * Serviço de roteamento para calcular distância por vias públicas.
 * Usa OSRM como backend padrão (pode ser sobrescrito via env).
 */

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface RouteResult {
  distanceKm: number;
  durationMin?: number;
  coordinates: Array<[number, number]>;
}

interface OsrmRouteResponse {
  code?: string;
  routes?: Array<{
    distance: number; // meters
    duration?: number; // seconds
    geometry?: {
      coordinates?: Array<[number, number]>; // [lon, lat]
    };
  }>;
}

const OSRM_BASE_URL =
  process.env.OSRM_BASE_URL?.replace(/\/$/, "") ||
  "https://router.project-osrm.org";
const OSRM_PROFILE = process.env.OSRM_PROFILE || "driving";

function roundKm(distanceKm: number): number {
  return Math.round(distanceKm * 10) / 10;
}

function roundMinutes(durationSeconds?: number): number | undefined {
  if (!durationSeconds && durationSeconds !== 0) return undefined;
  return Math.round((durationSeconds / 60) * 10) / 10;
}

async function getRoute(from: RoutePoint, to: RoutePoint): Promise<RouteResult> {
  const url = `${OSRM_BASE_URL}/route/v1/${OSRM_PROFILE}/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson&alternatives=false&steps=false`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "CompraColetiva/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`OSRM error: ${response.status}`);
  }

  const data = (await response.json()) as OsrmRouteResponse;

  if (!data.routes || data.routes.length === 0 || data.code !== "Ok") {
    throw new Error("OSRM route not found");
  }

  const route = data.routes[0];
  const coordinates = (route.geometry?.coordinates || []).map(([lon, lat]) => [
    lat,
    lon,
  ]) as Array<[number, number]>;

  return {
    distanceKm: roundKm(route.distance / 1000),
    durationMin: roundMinutes(route.duration),
    coordinates,
  };
}

async function getRouteDistanceKm(from: RoutePoint, to: RoutePoint): Promise<number> {
  const route = await getRoute(from, to);
  return route.distanceKm;
}

export const routingService = {
  getRoute,
  getRouteDistanceKm,
};
