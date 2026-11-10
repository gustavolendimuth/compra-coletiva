import { describe, it, expect, vi, beforeEach } from "vitest";
import { createProductWithImage, updateProductWithImage } from "../productWithImage";
import { createMockFullProduct } from "@/__tests__/mock-data";

vi.mock("@/api", () => ({
  productApi: {
    create: vi.fn(),
    update: vi.fn(),
    uploadImage: vi.fn(),
    deleteImage: vi.fn(),
  },
}));

import { productApi } from "@/api";

const image = new File(["<html>"], "fake.png", { type: "image/png" });
const rejectedUpload = new Error("Arquivo inválido. Apenas imagens (JPEG, PNG, WebP) são permitidas");

describe("productWithImage", () => {
  const product = createMockFullProduct({ id: "product-1" });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(productApi.create).mockResolvedValue(product);
    vi.mocked(productApi.update).mockResolvedValue(product);
    vi.mocked(productApi.uploadImage).mockResolvedValue(undefined as never);
    vi.mocked(productApi.deleteImage).mockResolvedValue(undefined as never);
  });

  describe("createProductWithImage", () => {
    it("imagem recusada não vira erro: o produto já foi criado e a falha volta em imageError", async () => {
      vi.mocked(productApi.uploadImage).mockRejectedValue(rejectedUpload);

      const result = await createProductWithImage({ data: { campaignId: "c1", name: "Queijo", price: 30, weight: 500 }, imageFile: image });

      expect(productApi.create).toHaveBeenCalledTimes(1);
      expect(result.createdProduct).toBe(product);
      expect(result.imageError).toBe(rejectedUpload);
    });

    it("sem falha no upload, imageError é null", async () => {
      const result = await createProductWithImage({ data: { campaignId: "c1", name: "Queijo", price: 30, weight: 500 }, imageFile: image });

      expect(productApi.uploadImage).toHaveBeenCalledWith("product-1", image);
      expect(result.imageError).toBeNull();
    });

    it("sem imagem, não tenta upload", async () => {
      await createProductWithImage({ data: { campaignId: "c1", name: "Queijo", price: 30, weight: 500 } });

      expect(productApi.uploadImage).not.toHaveBeenCalled();
    });

    it("falha ao criar o produto continua sendo erro", async () => {
      vi.mocked(productApi.create).mockRejectedValue(new Error("Nome obrigatório"));

      await expect(
        createProductWithImage({ data: { campaignId: "c1", name: "", price: 30, weight: 500 }, imageFile: image })
      ).rejects.toThrow("Nome obrigatório");
      expect(productApi.uploadImage).not.toHaveBeenCalled();
    });
  });

  describe("updateProductWithImage", () => {
    it("imagem recusada não vira erro: o produto já foi atualizado e a falha volta em imageError", async () => {
      vi.mocked(productApi.uploadImage).mockRejectedValue(rejectedUpload);

      const result = await updateProductWithImage({ productId: "product-1", data: { name: "Queijo" }, imageFile: image });

      expect(productApi.update).toHaveBeenCalledTimes(1);
      expect(result.updatedProduct).toBe(product);
      expect(result.imageError).toBe(rejectedUpload);
    });

    it("remover imagem sem enviar outra apaga a atual", async () => {
      await updateProductWithImage({ productId: "product-1", data: { name: "Queijo" }, removeImage: true });

      expect(productApi.deleteImage).toHaveBeenCalledWith("product-1");
      expect(productApi.uploadImage).not.toHaveBeenCalled();
    });
  });
});
