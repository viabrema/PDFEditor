import { createBlock, BLOCK_TYPES } from "./blockModel.js";

export function fileToDataUrl(file, readerFactory = () => new FileReader()) {
  return new Promise((resolve, reject) => {
    const reader = readerFactory();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function getImageDimensions(src, imageFactory = () => new Image()) {
  return new Promise((resolve, reject) => {
    const image = imageFactory();
    image.onload = () => resolve({ width: image.width, height: image.height });
    image.onerror = () => reject(new Error("Failed to load image"));
    image.src = src;
  });
}

export function scaleToFit({ width, height }, { maxWidth, maxHeight }) {
  if (width <= 0 || height <= 0) {
    return { width: maxWidth, height: maxHeight };
  }

  const widthRatio = maxWidth / width;
  const heightRatio = maxHeight / height;
  const scale = Math.min(widthRatio, heightRatio, 1);

  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

export async function createImageBlockFromFile(file, options = {}) {
  const {
    pageId,
    languageId,
    position = { x: 32, y: 32 },
    pageSize,
    maxSize,
    readerFactory,
    imageFactory,
  } = options;

  const fallbackSize = maxSize || {
    width: pageSize ? pageSize.width - 64 : 520,
    height: pageSize ? pageSize.height - 64 : 360,
  };
  const maxBounds = {
    maxWidth: fallbackSize.width,
    maxHeight: fallbackSize.height,
  };

  const src = await fileToDataUrl(file, readerFactory);
  let dimensions;

  try {
    dimensions = await getImageDimensions(src, imageFactory);
  } catch (error) {
    dimensions = fallbackSize;
  }

  const size = scaleToFit(dimensions, maxBounds);

  return createBlock({
    type: BLOCK_TYPES.IMAGE,
    content: { src },
    position,
    size,
    pageId,
    languageId,
  });
}
