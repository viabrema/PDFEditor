import { describe, expect, it } from "vitest";
import {
  applyFormatPatchToEdit,
  applyTableFormatPatch,
  buildResolvedCellStylesMap,
  coordsInScope,
  currencyCodeForLocale,
  effectiveFormatScope,
  ensureTableStyleContent,
  formatNumberForDisplay,
  formatTargetsFromEdit,
  mergePartialStyles,
  parseNumericCellText,
  resolveTableCellStyle,
} from "./tableFormatting";

describe("tableFormatting", () => {
  it("merges col, row and cell styles", () => {
    const content = {
      rows: [["1"]],
      colStyles: { "0": { textAlign: "center" } },
      rowStyles: { "0": { fontWeight: "bold" } },
      cellStyles: { "0,0": { color: "#ff0000" } },
    };
    const st = resolveTableCellStyle(content, 0, 0);
    expect(st?.textAlign).toBe("center");
    expect(st?.fontWeight).toBe("bold");
    expect(st?.color).toBe("#ff0000");
  });

  it("applies number format to row", () => {
    const content = {
      rows: [["1234.5", "10"]],
      rowStyles: {},
      colStyles: {},
      cellStyles: {},
    };
    applyTableFormatPatch(
      content,
      "row",
      0,
      0,
      { numberFormat: { kind: "number", decimals: 2, locale: "pt-BR" } },
    );
    expect(content.rows[0][0]).toContain("1");
    expect(content.rowStyles?.["0"]?.numberFormat?.kind).toBe("number");
  });

  it("formats currency for pt-BR", () => {
    const text = formatNumberForDisplay("1234.5", {
      kind: "currency",
      decimals: 2,
      locale: "pt-BR",
    });
    expect(text).toMatch(/R\$\s*1\.234,50/);
  });

  it("parses pt-BR number text", () => {
    expect(parseNumericCellText("1.234,56")).toBe(1234.56);
  });

  it("buildResolvedCellStylesMap includes row style", () => {
    const map = buildResolvedCellStylesMap({
      rows: [["a", "b"]],
      rowStyles: { "0": { backgroundColor: "#eee" } },
    });
    expect(map["0,0"]?.backgroundColor).toBe("#eee");
    expect(map["0,1"]?.backgroundColor).toBe("#eee");
  });

  it("mergePartialStyles returns undefined when empty", () => {
    expect(mergePartialStyles()).toBeUndefined();
  });

  it("applies column scope and percent format", () => {
    const content = {
      rows: [["0.25"]],
      rowStyles: {},
      colStyles: {},
      cellStyles: {},
    };
    applyTableFormatPatch(content, "column", 0, 0, {
      numberFormat: { kind: "percent", decimals: 1, locale: "en-US" },
    });
    expect(content.colStyles?.["0"]?.numberFormat?.kind).toBe("percent");
    expect(content.rows[0][0]).toMatch(/%/);
  });

  it("coordsInScope for column spans all rows", () => {
    const coords = coordsInScope("column", 0, 1, [
      ["a", "b"],
      ["c", "d"],
    ]);
    expect(coords).toEqual([
      [0, 1],
      [1, 1],
    ]);
  });

  it("ensureTableStyleContent initializes style maps", () => {
    const block: { content?: Record<string, unknown> } = {};
    ensureTableStyleContent(block);
    expect(block.content?.cellStyles).toBeDefined();
    expect(block.content?.rowStyles).toBeDefined();
    expect(block.content?.colStyles).toBeDefined();
  });

  it("currencyCodeForLocale maps locales", () => {
    expect(currencyCodeForLocale("en-US")).toBe("USD");
    expect(currencyCodeForLocale("pt-BR")).toBe("BRL");
    expect(currencyCodeForLocale("es-ES")).toBe("EUR");
    expect(currencyCodeForLocale("de-DE")).toBe("EUR");
  });

  it("applyTableFormatPatch cell scope creates cellStyles", () => {
    const content = { rows: [["9"]] };
    applyTableFormatPatch(content, "cell", 0, 0, { fontWeight: "bold" });
    expect(content.cellStyles?.["0,0"]?.fontWeight).toBe("bold");
  });

  it("coordsInScope cell returns empty when row missing", () => {
    expect(coordsInScope("cell", 5, 0, [["a"]])).toEqual([]);
  });

  it("coordsInScope cell returns coordinate when row exists", () => {
    expect(coordsInScope("cell", 0, 1, [["a", "b"]])).toEqual([[0, 1]]);
  });

  it("applyTableFormatPatch cell scope reformats numbers", () => {
    const content = { rows: [["1000"]] };
    applyTableFormatPatch(content, "cell", 0, 0, {
      numberFormat: { kind: "number", decimals: 0, locale: "pt-BR" },
    });
    expect(content.cellStyles?.["0,0"]?.numberFormat?.kind).toBe("number");
    expect(content.rows[0][0]).not.toBe("1000");
  });

  it("coordsInScope row returns empty when line missing", () => {
    expect(coordsInScope("row", 3, 0, [["a"]])).toEqual([]);
  });

  it("formatNumberForDisplay general and non-numeric passthrough", () => {
    expect(formatNumberForDisplay("abc", { kind: "number", decimals: 0, locale: "pt-BR" })).toBe(
      "abc",
    );
    expect(formatNumberForDisplay("1", undefined)).toBe("1");
    expect(formatNumberForDisplay("1", { kind: "general", decimals: 0, locale: "pt-BR" })).toBe("1");
  });

  it("formatNumberForDisplay percent and en-US currency", () => {
    const pct = formatNumberForDisplay("50%", {
      kind: "percent",
      decimals: 0,
      locale: "en-US",
    });
    expect(pct).toMatch(/50\s*%/);
    const cur = formatNumberForDisplay("10", {
      kind: "currency",
      decimals: 2,
      locale: "en-US",
    });
    expect(cur).toMatch(/\$10\.00/);
  });

  it("parseNumericCellText handles US grouping and percent", () => {
    expect(parseNumericCellText("")).toBeNull();
    expect(parseNumericCellText("1,234.56")).toBe(1234.56);
    expect(parseNumericCellText("12%")).toBe(12);
  });

  it("mergePartialStyles skips null layers", () => {
    expect(mergePartialStyles(null, { color: "#000" })?.color).toBe("#000");
  });

  it("applyTableFormatPatch initializes row and col style maps", () => {
    const content = { rows: [["1", "2"]] };
    applyTableFormatPatch(content, "row", 0, 0, { color: "#111" });
    applyTableFormatPatch(content, "column", 0, 1, { color: "#222" });
    expect(content.rowStyles?.["0"]?.color).toBe("#111");
    expect(content.colStyles?.["1"]?.color).toBe("#222");
  });

  it("parseNumericCellText uses comma as decimal separator", () => {
    expect(parseNumericCellText("3,14")).toBe(3.14);
  });

  it("formatNumberForDisplay percent treats small values as fraction", () => {
    const text = formatNumberForDisplay("0.25", {
      kind: "percent",
      decimals: 0,
      locale: "en-US",
    });
    expect(text).toMatch(/25\s*%/);
  });

  it("parseNumericCellText prefers US grouping when dot is after comma", () => {
    expect(parseNumericCellText("1,234.56")).toBe(1234.56);
  });

  it("formatNumberForDisplay percent divides large values", () => {
    const text = formatNumberForDisplay("75", {
      kind: "percent",
      decimals: 0,
      locale: "en-US",
    });
    expect(text).toMatch(/75\s*%/);
  });

  it("applyTableFormatPatch without numberFormat skips row rewrite", () => {
    const content = { rows: [["plain"]] };
    applyTableFormatPatch(content, "cell", 0, 0, { color: "#abc" });
    expect(content.rows[0][0]).toBe("plain");
  });

  it("applyTableFormatPatch with missing rows skips number rewrite loop", () => {
    const content = {};
    applyTableFormatPatch(content, "cell", 0, 0, {
      numberFormat: { kind: "number", decimals: 0, locale: "pt-BR" },
    });
    expect(content.cellStyles?.["0,0"]?.numberFormat?.kind).toBe("number");
  });

  it("ensureTableStyleContent keeps existing maps", () => {
    const block = {
      content: {
        cellStyles: { "0,0": {} },
        rowStyles: { "0": {} },
        colStyles: { "0": {} },
      },
    };
    ensureTableStyleContent(block);
    expect(block.content.cellStyles).toEqual({ "0,0": {} });
  });

  it("mergePartialStyles ignores non-object layers", () => {
    expect(mergePartialStyles("x" as never, { color: "#1" })?.color).toBe("#1");
  });

  it("parseNumericCellText returns null for invalid numbers", () => {
    expect(parseNumericCellText("not-a-number")).toBeNull();
  });

  it("formatNumberForDisplay number uses default decimals", () => {
    const text = formatNumberForDisplay("12.5", { kind: "number", locale: "pt-BR" });
    expect(text).toBe("13");
  });

  it("formatNumberForDisplay uses default locale and currency or percent decimals", () => {
    expect(formatNumberForDisplay("10", { kind: "currency" })).toMatch(/R\$/);
    expect(formatNumberForDisplay("0.5", { kind: "percent" })).toMatch(/%/);
    expect(formatNumberForDisplay("50%", { kind: "percent", decimals: 0, locale: "en-US" })).toMatch(
      /50\s*%/,
    );
  });

  it("parseNumericCellText accepts dot-only decimals", () => {
    expect(parseNumericCellText("1234.56")).toBe(1234.56);
  });

  it("formatTargetsFromEdit and applyFormatPatchToEdit handle multi selection", () => {
    const content = { rows: [["a", "b"], ["c", "d"]], cellStyles: {}, rowStyles: {}, colStyles: {} };
    applyFormatPatchToEdit(
      content,
      {
        blockId: "b",
        scope: "column",
        row: 0,
        col: 0,
        typing: false,
        multi: { cols: [0, 1] },
      },
      { color: "#222" },
    );
    expect(content.colStyles?.["0"]?.color).toBe("#222");
    expect(formatTargetsFromEdit(null)).toEqual([{ scope: "cell", row: 0, col: 0 }]);
    expect(effectiveFormatScope({ blockId: "b", scope: "cell", row: 0, col: 0, typing: false })).toBe(
      "cell",
    );
    expect(
      effectiveFormatScope({
        blockId: "b",
        scope: "row",
        row: 2,
        col: 0,
        typing: false,
        multi: { rows: [2] },
      }),
    ).toBe("row");
    expect(
      effectiveFormatScope({
        blockId: "b",
        scope: "column",
        row: 0,
        col: 1,
        typing: false,
        multi: { cols: [1] },
      }),
    ).toBe("column");
    expect(
      effectiveFormatScope({
        blockId: "b",
        scope: "row",
        row: 0,
        col: 0,
        typing: false,
        multi: { cells: [{ row: 0, col: 0 }] },
      }),
    ).toBe("row");
    expect(
      effectiveFormatScope({
        blockId: "b",
        scope: "cell",
        row: 0,
        col: 0,
        typing: false,
        multi: { cols: [0, 1] },
      }),
    ).toBe("column");
    expect(
      effectiveFormatScope({
        blockId: "b",
        scope: "row",
        row: 0,
        col: 0,
        typing: false,
        multi: {
          cells: [
            { row: 0, col: 0 },
            { row: 1, col: 1 },
          ],
        },
      }),
    ).toBe("cell");
    expect(
      formatTargetsFromEdit({
        blockId: "b",
        scope: "cell",
        row: 0,
        col: 0,
        typing: false,
        multi: { cells: [] },
      }),
    ).toEqual([{ scope: "cell", row: 0, col: 0 }]);
  });

  it("applyTableFormatPatch merges into existing cellStyles map", () => {
    const content = { rows: [["1"]], cellStyles: { "0,0": { color: "#000" } } };
    applyTableFormatPatch(content, "cell", 0, 0, { fontWeight: "bold" });
    expect(content.cellStyles?.["0,0"]?.color).toBe("#000");
    expect(content.cellStyles?.["0,0"]?.fontWeight).toBe("bold");
  });

  it("buildResolvedCellStylesMap treats non-array rows as empty", () => {
    expect(buildResolvedCellStylesMap({ rows: "x" as unknown as string[][] })).toEqual({});
  });

  it("coordsInScope column skips rows without the column index", () => {
    expect(coordsInScope("column", 0, 1, [["a", "b"], ["c"]])).toEqual([[0, 1]]);
  });

  it("parseNumericCellText treats nullish input as empty", () => {
    expect(parseNumericCellText(null as unknown as string)).toBeNull();
  });

  it("applyTableFormatPatch keeps patch when merge yields no style keys", () => {
    const content = { rows: [["1"]] };
    applyTableFormatPatch(content, "cell", 0, 0, { foo: "bar" } as never);
    expect(content.cellStyles?.["0,0"]).toEqual({ foo: "bar" });
  });
});
