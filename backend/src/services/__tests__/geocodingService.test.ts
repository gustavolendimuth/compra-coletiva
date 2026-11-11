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

  it.each([
    ["cepCache", (i: number) => geocodingService.getAddressFromCEP(cepFor(i))],
    ["coordsCache", (i: number) => geocodingService.getCoordinates(`Rua ${i}`, "", "Cidade", "SP")],
  ])("%s keeps at most 5000 entries, each for 24h", async (_cache, lookup) => {
    for (let i = 0; i <= 5000; i += 1) await lookup(i);
    expect(fetchMock).toHaveBeenCalledTimes(5001);

    // 5001 entradas: só a mais antiga (0) saiu
    await lookup(1);
    await lookup(5000);
    expect(fetchMock).toHaveBeenCalledTimes(5001);
    await lookup(0);
    expect(fetchMock).toHaveBeenCalledTimes(5002);

    jest.setSystemTime(Date.now() + DAY);
    await lookup(5000);
    expect(fetchMock).toHaveBeenCalledTimes(5002);

    jest.setSystemTime(Date.now() + 1);
    await lookup(5000);
    expect(fetchMock).toHaveBeenCalledTimes(5003);
  });
});
