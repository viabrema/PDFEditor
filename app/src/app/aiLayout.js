function toNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function normalizePosition(position) {
  if (!position || typeof position !== "object") {
    return null;
  }
  const x = toNumber(position.x);
  const y = toNumber(position.y);
  if (x === null || y === null) {
    return null;
  }
  return { x, y };
}

export function normalizeSize(size) {
  if (!size || typeof size !== "object") {
    return null;
  }
  const width = toNumber(size.width);
  const height = toNumber(size.height);
  if (width === null || height === null) {
    return null;
  }
  return { width, height };
}
