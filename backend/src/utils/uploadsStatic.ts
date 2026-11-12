import express, { Express, NextFunction, Request, Response } from "express";
import path from "path";
import { PAYMENT_PROOF_FOLDER, getPrivateUploadBaseDir } from "../services/paymentProofStorage";

const notFound = (_req: Request, res: Response) => {
  res.status(404).json({ status: "error", message: "Not found" });
};

/**
 * Monta /uploads (storage local público). Única montagem usada pelo app e pelos testes.
 * - toda resposta leva X-Content-Type-Options: nosniff
 * - comprovantes nunca são servidos aqui (inclusive arquivos legados ainda não migrados):
 *   o acesso é pelo GET /api/orders/:id/payment-proof
 * - o diretório privado também não, mesmo quando fica dentro do público (no Railway o
 *   serviço tem um volume só, então os dois dividem o mesmo disco)
 */
export function mountUploadsStatic(
  app: Express,
  uploadBaseDir: string,
  privateBaseDir: string = getPrivateUploadBaseDir()
): void {
  app.use("/uploads", (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    next();
  });
  app.use(`/uploads/${PAYMENT_PROOF_FOLDER}`, notFound);

  const privateRelative = path.relative(path.resolve(uploadBaseDir), path.resolve(privateBaseDir));
  if (privateRelative && !privateRelative.startsWith("..") && !path.isAbsolute(privateRelative)) {
    app.use(`/uploads/${privateRelative.split(path.sep).join("/")}`, notFound);
  }

  app.use("/uploads", express.static(uploadBaseDir));
}
