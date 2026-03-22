export function normalizeGridSize(size, fallback = 8) {
  const value = Number(size);
  if (Number.isFinite(value) && value > 0) {
    return value;
  }
  return fallback;
}

export function snapValue(value, gridSize) {
  const size = normalizeGridSize(gridSize);
  return Math.round(value / size) * size;
}

export function snapPoint(point, gridSize, enabled = true) {
  const safePoint = {
    x: point?.x ?? 0,
    y: point?.y ?? 0,
  };

  if (!enabled) {
    return safePoint;
  }

  return {
    x: snapValue(safePoint.x, gridSize),
    y: snapValue(safePoint.y, gridSize),
  };
}

export function snapRect(rect, gridSize, enabled = true) {
  const safeRect = {
    x: rect?.x ?? 0,
    y: rect?.y ?? 0,
    width: rect?.width ?? 0,
    height: rect?.height ?? 0,
  };

  if (!enabled) {
    return safeRect;
  }

  return {
    x: snapValue(safeRect.x, gridSize),
    y: snapValue(safeRect.y, gridSize),
    width: snapValue(safeRect.width, gridSize),
    height: snapValue(safeRect.height, gridSize),
  };
}
