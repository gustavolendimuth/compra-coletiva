// Bytes mínimos com a assinatura de cada formato aceito
export const JPEG_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
export const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
export const WEBP_BYTES = Buffer.concat([
  Buffer.from("RIFF"),
  Buffer.from([0x24, 0x00, 0x00, 0x00]),
  Buffer.from("WEBPVP8 "),
]);
export const PDF_BYTES = Buffer.from("%PDF-1.4\n%fake\n");
export const HTML_BYTES = Buffer.from("<html><script>alert(document.domain)</script></html>");

export function makeMulterFile(buffer: Buffer, originalname: string, mimetype = "image/png"): Express.Multer.File {
  return {
    fieldname: "file",
    originalname,
    encoding: "7bit",
    mimetype,
    size: buffer.length,
    buffer,
  } as Express.Multer.File;
}
