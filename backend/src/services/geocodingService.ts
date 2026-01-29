/**
 * Serviço de geocodificação para converter CEP em endereço e coordenadas.
 * Usa APIs gratuitas: ViaCEP (endereço) + Nominatim/OpenStreetMap (coordenadas).
 */

export interface AddressFromCEP {
  zipCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface FullGeocodingResult extends AddressFromCEP, Coordinates {}

// Interfaces para respostas das APIs externas
interface ViaCEPResponse {
  erro?: boolean;
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
}

interface BrasilAPIResponse {
  cep?: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name?: string;
}

// Cache em memória (TTL de 24h para CEPs, dados raramente mudam)
const cepCache = new Map<string, AddressFromCEP>();
const coordsCache = new Map<string, Coordinates>();

function normalizeCEP(cep: string): string {
  return cep.replace(/\D/g, "");
}

function formatCEP(cep: string): string {
  const clean = normalizeCEP(cep);
  return `${clean.slice(0, 5)}-${clean.slice(5)}`;
}

/**
 * Busca endereço a partir do CEP usando ViaCEP (primário) e BrasilAPI (fallback).
 */
async function getAddressFromCEP(cep: string): Promise<AddressFromCEP> {
  const normalized = normalizeCEP(cep);

  if (normalized.length !== 8) {
    throw new Error("CEP deve ter 8 dígitos");
  }

  // Verificar cache
  const cached = cepCache.get(normalized);
  if (cached) return cached;

  // Tentar ViaCEP primeiro
  try {
    const response = await fetch(
      `https://viacep.com.br/ws/${normalized}/json/`
    );
    const data: ViaCEPResponse = await response.json();

    if (data.erro) {
      throw new Error("CEP não encontrado no ViaCEP");
    }

    const result: AddressFromCEP = {
      zipCode: formatCEP(normalized),
      street: data.logradouro || "",
      neighborhood: data.bairro || "",
      city: data.localidade || "",
      state: data.uf || "",
    };

    cepCache.set(normalized, result);
    return result;
  } catch (viaCepError) {
    // Fallback: BrasilAPI
    try {
      const response = await fetch(
        `https://brasilapi.com.br/api/cep/v2/${normalized}`
      );

      if (!response.ok) {
        throw new Error("CEP não encontrado na BrasilAPI");
      }

      const data: BrasilAPIResponse = await response.json();

      const result: AddressFromCEP = {
        zipCode: formatCEP(normalized),
        street: data.street || "",
        neighborhood: data.neighborhood || "",
        city: data.city || "",
        state: data.state || "",
      };

      cepCache.set(normalized, result);
      return result;
    } catch {
      throw new Error(`CEP ${formatCEP(normalized)} não encontrado`);
    }
  }
}

/**
 * Busca coordenadas a partir de um endereço usando Nominatim (OpenStreetMap).
 * Rate limit: 1 req/seg (respeitado pelo cache).
 */
async function getCoordinates(
  street: string,
  number: string,
  city: string,
  state: string
): Promise<Coordinates> {
  const query = [number ? `${street}, ${number}` : street, city, state, "Brazil"]
    .filter(Boolean)
    .join(", ");

  // Verificar cache
  const cached = coordsCache.get(query);
  if (cached) return cached;

  try {
    const params = new URLSearchParams({
      q: query,
      format: "json",
      limit: "1",
      countrycodes: "br",
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          "User-Agent": "CompraColetiva/1.0",
        },
      }
    );

    const data = (await response.json()) as NominatimResult[];

    if (!data || data.length === 0) {
      // Fallback: tentar sem número (menos preciso)
      if (number) {
        return getCoordinates(street, "", city, state);
      }
      throw new Error("Coordenadas não encontradas para o endereço");
    }

    const result: Coordinates = {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
    };

    coordsCache.set(query, result);
    return result;
  } catch (error) {
    if (error instanceof Error && error.message.includes("Coordenadas")) {
      throw error;
    }
    throw new Error("Erro ao buscar coordenadas do endereço");
  }
}

/**
 * Geocodifica um CEP completo: retorna endereço + coordenadas.
 */
async function geocodeCEP(
  cep: string,
  number?: string
): Promise<FullGeocodingResult> {
  const address = await getAddressFromCEP(cep);
  const coords = await getCoordinates(
    address.street,
    number || "",
    address.city,
    address.state
  );

  return { ...address, ...coords };
}

export const geocodingService = {
  getAddressFromCEP,
  getCoordinates,
  geocodeCEP,
  normalizeCEP,
  formatCEP,
};
