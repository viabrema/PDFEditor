import ExcelJS from "exceljs";

/** .xlsx / .xlsm são ficheiros ZIP; assinatura local file header começa por "PK". */
export function validateXlsxZipBytes(bytes: Uint8Array): void {
  if (!bytes || bytes.byteLength < 4) {
    throw new Error("Ficheiro vazio ou demasiado pequeno para ser um Excel.");
  }
  const isPk = bytes[0] === 0x50 && bytes[1] === 0x4b;
  if (isPk) {
    return;
  }
  const looksOle =
    bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0;
  if (looksOle) {
    throw new Error(
      "Este ficheiro e Excel antigo (.xls). Guarde como .xlsx no Excel e volte a escolher o ficheiro.",
    );
  }
  throw new Error(
    "O ficheiro nao e um Excel .xlsx/.xlsm valido. Guarde a folha como .xlsx no Excel e tente novamente.",
  );
}

/** Copia para um ArrayBuffer contiguo (evita vistas desalinhadas que por vezes falham no JSZip). */
export function toContiguousArrayBuffer(data: ArrayBuffer | Uint8Array): ArrayBuffer {
  const view = data instanceof Uint8Array ? data : new Uint8Array(data);
  const copy = new Uint8Array(view.byteLength);
  copy.set(view);
  return copy.buffer;
}

export type A1Bounds = {
  top: number;
  left: number;
  bottom: number;
  right: number;
};

/** Coluna Excel 1-based: A=1, Z=26, AA=27 */
export function columnLettersToNumber(letters: string): number {
  const upper = letters.trim().toUpperCase();
  if (!upper || !/^[A-Z]+$/.test(upper)) {
    throw new Error(`Coluna invalida: "${letters}"`);
  }
  let n = 0;
  for (let i = 0; i < upper.length; i++) {
    n = n * 26 + (upper.charCodeAt(i) - 64);
  }
  if (n < 1 || n > 16384) {
    throw new Error("Coluna fora do intervalo permitido (max XFD).");
  }
  return n;
}

export function columnNumberToLetters(n: number): string {
  if (n < 1 || n > 16384) {
    throw new Error("Indice de coluna invalido.");
  }
  let s = "";
  let x = n;
  while (x > 0) {
    const r = (x - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    x = Math.floor((x - 1) / 26);
  }
  return s;
}

export function parseA1Cell(ref: string): { row: number; col: number } {
  const trimmed = ref.trim().toUpperCase();
  const m = trimmed.match(/^([A-Z]+)(\d+)$/);
  if (!m) {
    throw new Error(`Celula invalida: "${ref}" (esperado ex.: A1).`);
  }
  const col = columnLettersToNumber(m[1]);
  const row = parseInt(m[2], 10);
  if (row < 1 || row > 1048576) {
    throw new Error("Linha fora do intervalo permitido.");
  }
  return { row, col };
}

export function parseA1Range(range: string): A1Bounds {
  const trimmed = range.trim().toUpperCase().replace(/\s+/g, "");
  const parts = trimmed.split(":");
  if (parts.length !== 2) {
    throw new Error('Intervalo invalido: use o formato A1:G5 (duas celulas separadas por ":").');
  }
  const a = parseA1Cell(parts[0]);
  const b = parseA1Cell(parts[1]);
  return {
    top: Math.min(a.row, b.row),
    left: Math.min(a.col, b.col),
    bottom: Math.max(a.row, b.row),
    right: Math.max(a.col, b.col),
  };
}

/** Normaliza para armazenamento (maiusculas, ordem cantos). */
export function normalizeRangeString(range: string): string {
  const b = parseA1Range(range);
  return `${columnNumberToLetters(b.left)}${b.top}:${columnNumberToLetters(b.right)}${b.bottom}`;
}

export function excelCellToPlainString(cell: ExcelJS.Cell): string {
  const v = cell.value;
  if (v == null || v === "") {
    return "";
  }
  if (typeof v === "string") {
    return v;
  }
  if (typeof v === "number" || typeof v === "boolean") {
    return String(v);
  }
  if (v instanceof Date) {
    return v.toISOString();
  }
  if (typeof v === "object") {
    const o = v as unknown as Record<string, unknown>;
    if (typeof o.text === "string") {
      return o.text;
    }
    if (Array.isArray(o.richText)) {
      return (o.richText as { text: string }[]).map((p) => p.text || "").join("");
    }
    if ("result" in o && o.result != null) {
      return String(o.result);
    }
  }
  if (cell.text != null) {
    return cell.text;
  }
  return "";
}

export async function loadExcelWorkbook(data: ArrayBuffer | Uint8Array): Promise<ExcelJS.Workbook> {
  const view = data instanceof Uint8Array ? data : new Uint8Array(data);
  validateXlsxZipBytes(view);
  const buffer = toContiguousArrayBuffer(view);
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    if (/central directory|zip file|end of central directory|is this a zip/i.test(raw)) {
      throw new Error(
        "Nao foi possivel abrir o Excel: ficheiro corrompido, encriptado ou nao e .xlsx/.xlsm. Guarde como .xlsx no Excel.",
      );
    }
    throw e instanceof Error ? e : new Error(raw);
  }
  return workbook;
}

export function getSheetNames(workbook: ExcelJS.Workbook): string[] {
  return workbook.worksheets.map((ws) => ws.name);
}

export async function extractRangeToRows(
  data: ArrayBuffer | Uint8Array,
  sheetName: string,
  range: string,
): Promise<string[][]> {
  const workbook = await loadExcelWorkbook(data);
  const sheet = workbook.getWorksheet(sheetName);
  if (!sheet) {
    throw new Error(`Folha nao encontrada: "${sheetName}".`);
  }
  const b = parseA1Range(range);
  const rows: string[][] = [];
  for (let r = b.top; r <= b.bottom; r++) {
    const row: string[] = [];
    for (let c = b.left; c <= b.right; c++) {
      const cell = sheet.getCell(r, c);
      row.push(excelCellToPlainString(cell));
    }
    rows.push(row);
  }
  return rows;
}

export async function getSheetNamesFromExcelBytes(data: ArrayBuffer | Uint8Array): Promise<string[]> {
  const workbook = await loadExcelWorkbook(data);
  return getSheetNames(workbook);
}
