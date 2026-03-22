import type { Cell } from "exceljs";
import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import {
  argbToCss,
  bordersToSides,
  cellStyleToCssString,
  escapeHtmlStyleAttr,
  excelCellToTableStyle,
  excelColorToCss,
  excelStyleLayersToCellStyle,
  fillToBackgroundColor,
  fontAndAlignmentToStyle,
  getWorkbookClrSchemeMap,
  parseThemeClrScheme,
  scaleExcelCellStyleFontSize,
} from "./excelTableStyle";

describe("excelTableStyle", () => {
  const defaultClr = getWorkbookClrSchemeMap(new ExcelJS.Workbook());

  it("scaleExcelCellStyleFontSize scales pt and px font sizes", () => {
    expect(scaleExcelCellStyleFontSize({ fontSize: "10pt" }, 2).fontSize).toBe("20pt");
    expect(scaleExcelCellStyleFontSize({ fontSize: "12px" }, 0.5).fontSize).toBe("6px");
    expect(scaleExcelCellStyleFontSize({ fontWeight: "bold" }, 2).fontSize).toBeUndefined();
  });

  it("argbToCss maps 8 and 6 char hex", () => {
    expect(argbToCss({ argb: "FFFF0000" })).toBe("#FF0000");
    expect(argbToCss({ argb: "00FF00" })).toBe("#00FF00");
    expect(argbToCss({})).toBeUndefined();
    expect(argbToCss({ theme: 1 })).toBeUndefined();
    expect(argbToCss({ argb: "abc" })).toBeUndefined();
    expect(argbToCss({ argb: "1234567" })).toBeUndefined();
    expect(argbToCss(undefined)).toBeUndefined();
  });

  it("parseThemeClrScheme reads dk1/lt1/accent from theme xml", () => {
    const xml = `<?xml version="1.0"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
      <a:themeElements><a:clrScheme name="X">
        <a:dk1><a:sysClr val="windowText" lastClr="010203"/></a:dk1>
        <a:lt1><a:srgbClr val="AABBCC"/></a:lt1>
        <a:accent1><a:srgbClr val="112233"/></a:accent1>
      </a:clrScheme></a:themeElements></a:theme>`;
    const m = parseThemeClrScheme(xml);
    expect(m.dk1).toBe("010203");
    expect(m.lt1).toBe("AABBCC");
    expect(m.accent1).toBe("112233");
  });

  it("excelColorToCss resolves theme and indexed", () => {
    expect(excelColorToCss({ theme: 0 }, defaultClr)).toBe("#FFFFFF");
    expect(excelColorToCss({ theme: 1 }, defaultClr)).toBe("#000000");
    expect(excelColorToCss({ theme: 4 }, defaultClr)).toBe("#4F81BD");
    expect(excelColorToCss({ indexed: 2 }, defaultClr)).toBe("#FF0000");
    expect(excelColorToCss({ indexed: 64 }, defaultClr)).toBeUndefined();
  });

  it("excelColorToCss applies tint toward white and black", () => {
    const black = excelColorToCss({ theme: 1, tint: 0.5 }, defaultClr);
    expect(black).toMatch(/^#[0-9A-F]{6}$/);
    expect(black).not.toBe("#000000");
    const white = excelColorToCss({ theme: 0, tint: -0.3 }, defaultClr);
    expect(white).toMatch(/^#[0-9A-F]{6}$/);
    expect(white).not.toBe("#FFFFFF");
  });

  it("fillToBackgroundColor reads solid and gradient first stop", () => {
    expect(
      fillToBackgroundColor(
        {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF112233" },
        },
        defaultClr,
      ),
    ).toBe("#112233");
    expect(fillToBackgroundColor({ type: "pattern", pattern: "none" }, defaultClr)).toBeUndefined();
    expect(
      fillToBackgroundColor(
        {
          type: "pattern",
          pattern: "lightHorizontal",
          fgColor: { argb: "FFAAAAAA" },
        },
        defaultClr,
      ),
    ).toBe("#AAAAAA");
    expect(
      fillToBackgroundColor(
        {
          type: "pattern",
          pattern: "darkGray",
          fgColor: { theme: 1 },
          bgColor: { argb: "FFCAFE00" },
        },
        defaultClr,
      ),
    ).toBe("#000000");
    expect(
      fillToBackgroundColor(
        {
          type: "pattern",
          pattern: "none",
          bgColor: { argb: "FFBBBBBB" },
        },
        defaultClr,
      ),
    ).toBe("#BBBBBB");
    expect(fillToBackgroundColor(undefined, defaultClr)).toBeUndefined();
    expect(fillToBackgroundColor("nope" as unknown as import("exceljs").Fill, defaultClr)).toBeUndefined();
    expect(
      fillToBackgroundColor(
        {
          type: "gradient",
          gradient: "angle",
          degree: 0,
          stops: [{ position: 0, color: { argb: "FFABCDEF" } }],
        },
        defaultClr,
      ),
    ).toBe("#ABCDEF");
    expect(
      fillToBackgroundColor({ type: "gradient", gradient: "angle", degree: 0, stops: [] }, defaultClr),
    ).toBeUndefined();
  });

  it("bordersToSides builds CSS fragments", () => {
    const sides = bordersToSides(
      {
        top: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "double", color: { argb: "FFFF0000" } },
        left: { style: "dotted", color: { argb: "FF00FF00" } },
        right: { style: "mediumDashed", color: { argb: "FF0000FF" } },
      },
      defaultClr,
    );
    expect(sides.borderTop).toContain("1px solid");
    expect(sides.borderTop).toContain("#000000");
    expect(sides.borderBottom).toContain("double");
    expect(sides.borderLeft).toContain("dotted");
    expect(sides.borderRight).toContain("2px dashed");
    expect(bordersToSides(undefined, defaultClr)).toEqual({});
  });

  it("border falls back for unknown style", () => {
    const sides = bordersToSides(
      {
        top: { style: "unknownStyle" as "thin", color: { argb: "FF111111" } },
      },
      defaultClr,
    );
    expect(sides.borderTop).toContain("1px solid");
    expect(
      bordersToSides(
        {
          left: { style: "thin" },
        },
        defaultClr,
      ).borderLeft,
    ).toContain("#000000");
  });

  it("fontAndAlignmentToStyle maps font and alignment", () => {
    expect(
      fontAndAlignmentToStyle(
        {
          name: "Calibri",
          size: 11,
          bold: true,
          italic: true,
          color: { argb: "FF001122" },
        },
        { horizontal: "center", vertical: "middle" },
        defaultClr,
      ),
    ).toMatchObject({
      fontFamily: "Calibri",
      fontSize: "11pt",
      fontWeight: "bold",
      fontStyle: "italic",
      color: "#001122",
      textAlign: "center",
      verticalAlign: "middle",
    });
    expect(
      fontAndAlignmentToStyle(undefined, { horizontal: "justify", vertical: "top" }, defaultClr),
    ).toMatchObject({ textAlign: "justify", verticalAlign: "top" });
    expect(
      fontAndAlignmentToStyle(
        undefined,
        {
          horizontal: "fill" as const,
          vertical: "distributed" as const,
        },
        defaultClr,
      ),
    ).toEqual({});
    expect(
      fontAndAlignmentToStyle(
        undefined,
        {
          horizontal: "weird" as "left",
          vertical: "odd" as "top",
        },
        defaultClr,
      ),
    ).toEqual({});
    expect(fontAndAlignmentToStyle({ size: 0 }, undefined, defaultClr)).not.toHaveProperty("fontSize");
  });

  it("excelStyleLayersToCellStyle returns null when empty", () => {
    expect(excelStyleLayersToCellStyle({ clrMap: defaultClr })).toBeNull();
  });

  it("excelCellToTableStyle returns null when style missing", () => {
    expect(excelCellToTableStyle({ style: undefined } as unknown as Cell)).toBeNull();
  });

  it("excelCellToTableStyle reads from live worksheet cell", () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("T");
    const cell = ws.getCell(1, 1);
    cell.value = "hi";
    cell.font = { bold: true, size: 12, name: "Arial", color: { argb: "FF123456" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEDDCC" } };
    cell.alignment = { horizontal: "right", vertical: "bottom" };
    cell.border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };
    const st = excelCellToTableStyle(cell);
    expect(st?.fontWeight).toBe("bold");
    expect(st?.fontSize).toBe("12pt");
    expect(st?.backgroundColor).toBe("#EEDDCC");
    expect(st?.color).toBe("#123456");
    expect(st?.textAlign).toBe("right");
    expect(st?.borderTop).toBeDefined();
  });

  it("excelCellToTableStyle resolves theme font color", () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("T");
    const cell = ws.getCell(1, 1);
    cell.value = "x";
    cell.font = { color: { theme: 0 } };
    const st = excelCellToTableStyle(cell);
    expect(st?.color).toBe("#FFFFFF");
  });

  it("cellStyleToCssString joins declarations", () => {
    expect(cellStyleToCssString({ backgroundColor: "#fafafa" })).toBe("background-color:#fafafa");
    expect(cellStyleToCssString({ fontSize: "8pt" })).toContain("font-size:");
    const css = cellStyleToCssString({
      color: "#111111",
      backgroundColor: "#eee",
      fontFamily: "Georgia",
      fontSize: "9pt",
      fontWeight: "bold",
      fontStyle: "italic",
      textAlign: "justify",
      verticalAlign: "bottom",
      borderTop: "1px solid #000",
      borderRight: "1px solid #111",
      borderBottom: "1px solid #222",
      borderLeft: "1px solid #333",
    });
    expect(css).toContain("color:#111111");
    expect(css).toContain("background-color:#eee");
    expect(css).toContain("font-family:Georgia");
    expect(css).toContain("font-size:9pt");
    expect(css).toContain("font-weight:bold");
    expect(css).toContain("font-style:italic");
    expect(css).toContain("text-align:justify");
    expect(css).toContain("vertical-align:bottom");
    expect(css).toContain("border-top:");
    expect(css).toContain("border-right:");
    expect(css).toContain("border-bottom:");
    expect(css).toContain("border-left:");
  });

  it("escapeHtmlStyleAttr escapes quotes and ampersands", () => {
    expect(escapeHtmlStyleAttr('color:red;font:"Arial"')).toContain("&quot;");
    expect(escapeHtmlStyleAttr("a&b")).toContain("&amp;");
  });
});
