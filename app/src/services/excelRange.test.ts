import ExcelJS from "exceljs";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Cell } from "exceljs";
import {
  columnLettersToNumber,
  columnNumberToLetters,
  excelCellToPlainString,
  extractRangeToRows,
  extractRangeToTableContent,
  extractTableContentFromWorksheet,
  getSheetNames,
  getSheetNamesFromExcelBytes,
  loadExcelWorkbook,
  normalizeRangeString,
  parseA1Cell,
  parseA1Range,
  toContiguousArrayBuffer,
  validateXlsxZipBytes,
} from "./excelRange";

describe("excelRange", () => {
  describe("validateXlsxZipBytes", () => {
    it("rejects nullish buffer", () => {
      expect(() => validateXlsxZipBytes(null as unknown as Uint8Array)).toThrow(/vazio/);
    });

    it("rejects empty buffer", () => {
      expect(() => validateXlsxZipBytes(new Uint8Array(0))).toThrow(/vazio/);
    });

    it("rejects OLE .xls signature", () => {
      const ole = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1]);
      expect(() => validateXlsxZipBytes(ole)).toThrow(/\.xls/);
    });

    it("rejects non-zip bytes", () => {
      expect(() => validateXlsxZipBytes(new Uint8Array([1, 2, 3, 4]))).toThrow(/nao e um Excel/);
    });
  });

  describe("toContiguousArrayBuffer", () => {
    it("copies subarray so loadExcelWorkbook succeeds", async () => {
      const wb = new ExcelJS.Workbook();
      wb.addWorksheet("S").getCell(1, 1).value = "x";
      const full = new Uint8Array(await wb.xlsx.writeBuffer());
      const sliced = full.subarray(0, full.byteLength);
      const ab = toContiguousArrayBuffer(sliced);
      const loaded = await loadExcelWorkbook(ab);
      expect(getSheetNames(loaded)).toContain("S");
    });

    it("accepts ArrayBuffer branch", async () => {
      const wb = new ExcelJS.Workbook();
      wb.addWorksheet("AB").getCell(1, 1).value = "y";
      const u8 = new Uint8Array(await wb.xlsx.writeBuffer());
      const rawAb = u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
      const copied = toContiguousArrayBuffer(rawAb);
      const loaded = await loadExcelWorkbook(copied);
      expect(getSheetNames(loaded)).toContain("AB");
    });
  });

  describe("loadExcelWorkbook errors", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("maps JSZip central directory message to Portuguese", async () => {
      const truncatedZip = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0, 0, 0]);
      await expect(loadExcelWorkbook(truncatedZip)).rejects.toThrow(/Nao foi possivel abrir/);
    });

    it("wraps non-Error rejection from xlsx.load", async () => {
      const Original = ExcelJS.Workbook;
      vi.spyOn(ExcelJS, "Workbook").mockImplementationOnce(function (this: unknown, ...args: unknown[]) {
        const inst = new Original(...args);
        inst.xlsx.load = vi.fn().mockRejectedValue("plain-rejection");
        return inst;
      });
      const pk = new Uint8Array([0x50, 0x4b, 0, 0]);
      await expect(loadExcelWorkbook(pk)).rejects.toThrow("plain-rejection");
    });

    it("rethrows Error when message is not a zip parse hint", async () => {
      const Original = ExcelJS.Workbook;
      vi.spyOn(ExcelJS, "Workbook").mockImplementationOnce(function (this: unknown, ...args: unknown[]) {
        const inst = new Original(...args);
        inst.xlsx.load = vi.fn().mockRejectedValue(new Error("some other excel error"));
        return inst;
      });
      const pk = new Uint8Array([0x50, 0x4b, 0, 0]);
      await expect(loadExcelWorkbook(pk)).rejects.toThrow("some other excel error");
    });
  });

  describe("excelCellToPlainString", () => {
    it("uses empty string when cell.text missing", () => {
      const cell = { value: { unknown: 1 }, text: undefined } as Cell;
      expect(excelCellToPlainString(cell)).toBe("");
    });

    it("uses cell.text when value object has no known shape", () => {
      const cell = { value: { unknown: 1 }, text: "fallback" } as Cell;
      expect(excelCellToPlainString(cell)).toBe("fallback");
    });

    it("maps richText parts with missing text to empty string", () => {
      const cell = {
        value: { richText: [{}, { text: "b" }] },
      } as Cell;
      expect(excelCellToPlainString(cell)).toBe("b");
    });

    it("ignores non-string text property on object value", () => {
      const cell = { value: { text: 42 } } as Cell;
      expect(excelCellToPlainString(cell)).toBe("");
    });

    it("bigint value skips object cell parsing", () => {
      const cell = { value: BigInt(99) } as Cell;
      expect(excelCellToPlainString(cell)).toBe("");
    });
  });

  describe("parseA1Cell", () => {
    it("parses A1 and Z9", () => {
      expect(parseA1Cell("A1")).toEqual({ row: 1, col: 1 });
      expect(parseA1Cell("z9")).toEqual({ row: 9, col: 26 });
    });

    it("parses AA1", () => {
      expect(parseA1Cell("AA1")).toEqual({ row: 1, col: 27 });
    });

    it("rejects invalid row and column", () => {
      expect(() => parseA1Cell("A0")).toThrow(/Linha fora/);
      expect(() => parseA1Cell("A1048577")).toThrow(/Linha fora/);
      expect(() => parseA1Cell("1A")).toThrow(/Celula invalida/);
    });
  });

  describe("parseA1Range", () => {
    it("parses A1:G5", () => {
      expect(parseA1Range("A1:G5")).toEqual({
        top: 1,
        left: 1,
        bottom: 5,
        right: 7,
      });
    });

    it("normalizes inverted corners G5:A1", () => {
      expect(parseA1Range("G5:A1")).toEqual({
        top: 1,
        left: 1,
        bottom: 5,
        right: 7,
      });
    });

    it("rejects invalid range", () => {
      expect(() => parseA1Range("A1")).toThrow(/Intervalo invalido/);
      expect(() => parseA1Range("A1:B")).toThrow(/Celula invalida/);
    });
  });

  describe("column round-trip", () => {
    it("round-trips common columns", () => {
      expect(columnNumberToLetters(1)).toBe("A");
      expect(columnNumberToLetters(26)).toBe("Z");
      expect(columnNumberToLetters(27)).toBe("AA");
      expect(columnLettersToNumber("XFD")).toBe(16384);
    });

    it("rejects invalid column letters and index", () => {
      expect(() => columnLettersToNumber("")).toThrow(/Coluna invalida/);
      expect(() => columnLettersToNumber("A1")).toThrow(/Coluna invalida/);
      expect(() => columnLettersToNumber("XFE")).toThrow(/fora do intervalo/);
      expect(() => columnNumberToLetters(0)).toThrow(/Indice/);
      expect(() => columnNumberToLetters(20000)).toThrow(/Indice/);
    });
  });

  describe("normalizeRangeString", () => {
    it("uppercases and orders", () => {
      expect(normalizeRangeString("g5:a1")).toBe("A1:G5");
    });
  });

  describe("extractRangeToRows", () => {
    async function buildSampleBuffer() {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Folha1");
      ws.getCell(1, 1).value = "a";
      ws.getCell(1, 2).value = "b";
      ws.getCell(2, 1).value = "c";
      ws.getCell(2, 2).value = 42;
      const buf = await wb.xlsx.writeBuffer();
      return new Uint8Array(buf);
    }

    it("extracts rectangular range", async () => {
      const bytes = await buildSampleBuffer();
      const rows = await extractRangeToRows(bytes, "Folha1", "A1:B2");
      expect(rows).toEqual([
        ["a", "b"],
        ["c", "42"],
      ]);
    });

    it("lists sheet names", async () => {
      const bytes = await buildSampleBuffer();
      const names = await getSheetNamesFromExcelBytes(bytes);
      expect(names).toContain("Folha1");
    });

    it("throws for missing sheet", async () => {
      const bytes = await buildSampleBuffer();
      await expect(extractRangeToRows(bytes, "Nope", "A1:A1")).rejects.toThrow(/Folha nao encontrada/);
    });

    it("loads workbook from ArrayBuffer and lists sheets", async () => {
      const bytes = await buildSampleBuffer();
      const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      const wb = await loadExcelWorkbook(ab);
      const names = getSheetNames(wb);
      expect(names).toContain("Folha1");
    });

    it("reads formula result, boolean, rich text, date, empty string, hyperlink text", async () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("R");
      ws.getCell(1, 1).value = { formula: "1+1", result: 2 } as any;
      ws.getCell(1, 2).value = true;
      ws.getCell(1, 3).value = { richText: [{ text: "x" }, { text: "y" }] } as any;
      ws.getCell(1, 4).value = new Date(Date.UTC(2024, 0, 5, 12, 0, 0));
      ws.getCell(1, 5).value = "";
      ws.getCell(1, 6).value = { text: "Hi", hyperlink: "https://example.com" } as any;
      const buf = new Uint8Array(await wb.xlsx.writeBuffer());
      const rows = await extractRangeToRows(buf, "R", "A1:F1");
      expect(rows[0][0]).toBe("2");
      expect(rows[0][1]).toBe("true");
      expect(rows[0][2]).toBe("xy");
      expect(rows[0][3]).toMatch(/2024-01-05/);
      expect(rows[0][4]).toBe("");
      expect(rows[0][5]).toBe("Hi");
    });

    it("extractRangeToTableContent includes merges fully inside range", async () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("M");
      ws.getCell(1, 1).value = "merged";
      ws.mergeCells(1, 1, 2, 2);
      ws.getCell(1, 3).value = "x";
      ws.getCell(2, 3).value = "y";
      const buf = new Uint8Array(await wb.xlsx.writeBuffer());
      const { rows, merges } = await extractRangeToTableContent(buf, "M", "A1:C2");
      expect(merges).toEqual([{ r: 0, c: 0, rowspan: 2, colspan: 2 }]);
      expect(rows[0][0]).toBe("merged");
      expect(rows[0][1]).toBe("");
      expect(rows[1][0]).toBe("");
      expect(rows[1][1]).toBe("");
      expect(rows[0][2]).toBe("x");
      expect(rows[1][2]).toBe("y");
    });

    it("extractTableContentFromWorksheet handles sheet without _merges", async () => {
      const bytes = await buildSampleBuffer();
      const wb = await loadExcelWorkbook(bytes);
      const sheet = wb.getWorksheet("Folha1")!;
      delete (sheet as unknown as { _merges?: unknown })._merges;
      const { merges } = extractTableContentFromWorksheet(sheet, "A1:B2");
      expect(merges).toEqual([]);
    });

    it("extractRangeToTableContent omits merge not fully inside range", async () => {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("P");
      ws.getCell(1, 1).value = "a";
      ws.mergeCells(1, 1, 1, 3);
      const buf = new Uint8Array(await wb.xlsx.writeBuffer());
      const { merges } = await extractRangeToTableContent(buf, "P", "B1:C1");
      expect(merges).toEqual([]);
    });
  });
});
