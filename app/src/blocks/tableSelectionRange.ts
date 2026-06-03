export function sortedRange(a: number, b: number): [number, number] {
  return a <= b ? [a, b] : [b, a];
}

export function uniqueSorted(nums: number[]): number[] {
  return [...new Set(nums)].sort((x, y) => x - y);
}

export function toggleInList(list: number[], value: number): number[] {
  const set = new Set(list);
  if (set.has(value)) {
    set.delete(value);
  } else {
    set.add(value);
  }
  return uniqueSorted([...set]);
}

export function rangeIndices(from: number, to: number): number[] {
  const [lo, hi] = sortedRange(from, to);
  const out: number[] = [];
  for (let i = lo; i <= hi; i++) {
    out.push(i);
  }
  return out;
}

export function cellSelectionKey(row: number, col: number): string {
  return `${row},${col}`;
}

export function rectCellCoords(
  row0: number,
  col0: number,
  row1: number,
  col1: number,
): Array<{ row: number; col: number }> {
  const [rMin, rMax] = sortedRange(row0, row1);
  const [cMin, cMax] = sortedRange(col0, col1);
  const cells: Array<{ row: number; col: number }> = [];
  for (let r = rMin; r <= rMax; r++) {
    for (let c = cMin; c <= cMax; c++) {
      cells.push({ row: r, col: c });
    }
  }
  return cells;
}
