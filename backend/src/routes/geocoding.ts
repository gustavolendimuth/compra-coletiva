import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { geocodingService } from "../services/geocodingService";
import { geoRateLimiter } from "../middleware/rateLimiter";

const router = Router();

// Todas as rotas chamam ViaCEP/Nominatim: limite compartilhado com /campaigns/:idOrSlug/distance
router.use(geoRateLimiter);

const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

const cepParamSchema = z.object({
  cep: z
    .string()
    .regex(/^\d{5}-?\d{3}$/, "CEP deve ter o formato XXXXX-XXX ou XXXXXXXX"),
});

/**
 * GET /api/geocoding/cep/:cep
 * Retorna endereço completo + coordenadas a partir de um CEP.
 */
router.get(
  "/cep/:cep",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { cep } = cepParamSchema.parse(req.params);

    const result = await geocodingService.geocodeCEP(cep);

    res.json(result);
  })
);

/**
 * GET /api/geocoding/cep/:cep/coordinates
 * Retorna coordenadas com endereço completo (rua + número) para maior precisão.
 */
router.get(
  "/cep/:cep/coordinates",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { cep } = cepParamSchema.parse(req.params);
    const number = typeof req.query.number === "string" ? req.query.number : "";

    const result = await geocodingService.geocodeCEP(cep, number);

    res.json(result);
  })
);

export default router;
