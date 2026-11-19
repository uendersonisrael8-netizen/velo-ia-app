import type { PendingImage } from "./types";

const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
const TARGET_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const ATTEMPTS = [
  { maxDimension: 1600, quality: 0.82 },
  { maxDimension: 1280, quality: 0.72 },
  { maxDimension: 1024, quality: 0.62 },
  { maxDimension: 800, quality: 0.55 },
];

function base64Bytes(dataUrl: string) {
  const comma = dataUrl.indexOf(",");
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : "";
  return Math.ceil((base64.length * 3) / 4);
}

function renderJpeg(bitmap: ImageBitmap, maxDimension: number, quality: number) {
  const scale = Math.min(
    1,
    maxDimension / Math.max(bitmap.width, bitmap.height),
  );
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Não consegui preparar essa imagem.");

  // JPEG não tem transparência: um fundo claro evita áreas pretas em PNGs.
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", quality);
}

/**
 * Comprime a foto antes do envio. O corpo do chat na Vercel tem limite de
 * ~4,5 MB e o base64 cresce ~33%; 2 MB de binário é um alvo seguro.
 */
export async function prepareImage(file: File): Promise<PendingImage> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Escolha uma imagem JPG, PNG ou WebP.");
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("A imagem original pode ter até 8 MB.");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Não consegui abrir essa imagem. Tente outra foto.");
  }

  try {
    for (const attempt of ATTEMPTS) {
      const dataUrl = renderJpeg(
        bitmap,
        attempt.maxDimension,
        attempt.quality,
      );
      const bytes = base64Bytes(dataUrl);
      if (bytes <= TARGET_BYTES) {
        return { dataUrl, name: file.name, bytes };
      }
    }
  } finally {
    bitmap.close();
  }

  throw new Error("Essa imagem continua grande demais. Tente uma foto menor.");
}
