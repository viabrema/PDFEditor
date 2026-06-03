const PAGE_SIZES = {
  A4: { width: 794, height: 1123 },
  Letter: { width: 816, height: 1056 },
};

export function getPageSize(format, orientation) {
  const base = PAGE_SIZES[format] || PAGE_SIZES.A4;
  if (orientation === "landscape") {
    return { width: base.height, height: base.width };
  }
  return base;
}
