import express, { Express, NextFunction, Request, Response } from "express";
import { PAYMENT_PROOF_FOLDER } from "../services/paymentProofStorage";

/**
 * Monta /uploads (storage local público). Única montagem usada pelo app e pelos testes.
 * - toda resposta leva X-Content-Type-Options: nosniff
 * - comprovantes nunca são servidos aqui (inclusive arquivos legados ainda não migrados):
 *   o acesso é pelo GET /api/orders/:id/payment-proof
 */
export function mountUploadsStatic(app: Express, uploadBaseDir: string): void {
  app.use("/uploads", (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    next();
  });
  app.use(`/uploads/${PAYMENT_PROOF_FOLDER}`, (_req: Request, res: Response) => {
    res.status(404).json({ status: "error", message: "Not found" });
  });
  app.use("/uploads", express.static(uploadBaseDir));
}
