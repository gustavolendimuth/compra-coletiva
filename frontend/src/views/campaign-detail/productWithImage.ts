import { productApi, Product, CreateProductDto, UpdateProductDto } from "@/api";

export interface UpdateProductPayload {
  productId: string;
  data: UpdateProductDto;
  imageFile?: File | null;
  removeImage?: boolean;
}

/**
 * Sobe a imagem sem derrubar a operação: o produto já foi gravado, então falha só da
 * imagem volta como imageError. Se virasse erro, o modal ficava aberto e uma nova
 * tentativa duplicava o produto.
 */
async function uploadImageKeepingProduct(productId: string, imageFile: File): Promise<unknown> {
  try {
    await productApi.uploadImage(productId, imageFile);
    return null;
  } catch (error) {
    return error;
  }
}

export async function createProductWithImage({
  data,
  imageFile,
}: {
  data: CreateProductDto;
  imageFile?: File | null;
}): Promise<{ createdProduct: Product; imageError: unknown }> {
  const createdProduct = await productApi.create(data);
  const imageError = imageFile ? await uploadImageKeepingProduct(createdProduct.id, imageFile) : null;
  return { createdProduct, imageError };
}

export async function updateProductWithImage({
  productId,
  data,
  imageFile,
  removeImage,
}: UpdateProductPayload): Promise<{ updatedProduct: Product; imageError: unknown }> {
  const updatedProduct = await productApi.update(productId, data);

  if (removeImage && !imageFile) {
    await productApi.deleteImage(productId);
  }

  const imageError = imageFile ? await uploadImageKeepingProduct(productId, imageFile) : null;
  return { updatedProduct, imageError };
}
