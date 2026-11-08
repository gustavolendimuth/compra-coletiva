import { GEOCODING_CACHE_MAX_ENTRIES, GEOCODING_CACHE_TTL_MS } from "../geocodingService";

type Service = typeof import("../geocodingService").geocodingService;
let geocodingService: Service;

const DAY = 24 * 60 * 60 * 1000;

const fetchMock = jest.fn();

function viaCepResponse(cep: string) {
  return {
    ok: true,
    json: async () => ({ cep, logradouro: "Rua A", bairro: "Centro", localidade: "Cidade", uf: "SP" }),
  };
}

function nominatimResponse() {
  return { ok: true, json: async () => [{ lat: "-23.5", lon: "-46.6" }] };
}

const cepFor = (i: number) => String(10000000 + i);
const viaCepCalls = (cep: string) =>
  fetchMock.mock.calls.filter(([url]) => String(url).includes(`/ws/${cep}/json`)).length;
const nominatimCalls = () =>
  fetchMock.mock.calls.filter(([url]) => String(url).includes("nominatim")).length;

describe("geocodingService caches", () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate"] });
    jest.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    fetchMock.mockReset();
    fetchMock.mockImplementation(async (url: string) =>
      String(url).includes("nominatim") ? nominatimResponse() : viaCepResponse("x")
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    // módulo novo por teste: caches vazios
    jest.isolateModules(() => {
      geocodingService = require("../geocodingService").geocodingService;
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("limits are 5000 entries and 24h", () => {
    expect(GEOCODING_CACHE_MAX_ENTRIES).toBe(5000);
    expect(GEOCODING_CACHE_TTL_MS).toBe(DAY);
  });

  it("cepCache keeps at most 5000: after 5001 CEPs the first is fetched again", async () => {
    for (let i = 0; i <= 5000; i += 1) {
      await geocodingService.getAddressFromCEP(cepFor(i));
    }
    await geocodingService.getAddressFromCEP(cepFor(5000));
    expect(viaCepCalls(cepFor(5000))).toBe(1);

    await geocodingService.getAddressFromCEP(cepFor(0));
    expect(viaCepCalls(cepFor(0))).toBe(2);
  });

  it("coordsCache keeps at most 5000: after 5001 addresses the first is fetched again", async () => {
    for (let i = 0; i <= 5000; i += 1) {
      await geocodingService.getCoordinates(`Rua ${i}`, "", "Cidade", "SP");
    }
    expect(nominatimCalls()).toBe(5001);

    await geocodingService.getCoordinates("Rua 5000", "", "Cidade", "SP");
    expect(nominatimCalls()).toBe(5001);

    await geocodingService.getCoordinates("Rua 0", "", "Cidade", "SP");
    expect(nominatimCalls()).toBe(5002);
  });

  it("cepCache 24h: cached until 24h, fetched again after", async () => {
    await geocodingService.getAddressFromCEP("01001000");
    jest.setSystemTime(Date.now() + DAY - 1);
    await geocodingService.getAddressFromCEP("01001000");
    expect(viaCepCalls("01001000")).toBe(1);

    jest.setSystemTime(Date.now() + 2);
    await geocodingService.getAddressFromCEP("01001000");
    expect(viaCepCalls("01001000")).toBe(2);
  });

  it("coordsCache 24h: cached until 24h, fetched again after", async () => {
    await geocodingService.getCoordinates("Rua X", "10", "Cidade", "SP");
    jest.setSystemTime(Date.now() + DAY - 1);
    await geocodingService.getCoordinates("Rua X", "10", "Cidade", "SP");
    expect(nominatimCalls()).toBe(1);

    jest.setSystemTime(Date.now() + 2);
    await geocodingService.getCoordinates("Rua X", "10", "Cidade", "SP");
    expect(nominatimCalls()).toBe(2);
  });
});
