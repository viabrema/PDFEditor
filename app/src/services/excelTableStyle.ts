import type { Alignment, Border, Borders, Cell, Fill, Font } from "exceljs";
import { excelColorToCss, getWorkbookClrSchemeMap, type OoxmlColorSource } from "./excelThemeColors";

export type { OoxmlColorSource } from "./excelThemeColors";
export {
  argbToCss,
  excelColorToCss,
  getWorkbookClrSchemeMap,
  parseThemeClrScheme,
} from "./excelThemeColors";

/** Estilo serializavel por celula (CSS) para canvas + export PDF. */
export type ExcelTableCellStyle = {
  color?: string;
  backgroundColor?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: "bold" | "normal";
  fontStyle?: "italic" | "normal";
  textAlign?: "left" | "center" | "right" | "justify";
  verticalAlign?: "top" | "middle" | "bottom";
  borderTop?: string;
  borderRight?: string;
  borderBottom?: string;
  borderLeft?: string;
};

const BORDER_STYLE_CSS: Partial<Record<string, string>> = {
  thin: "1px solid",
  hair: "1px solid",
  dotted: "1px dotted",
  dashed: "1px dashed",
  medium: "2px solid",
  thick: "3px solid",
  double: "3px double",
  mediumDashed: "2px dashed",
  dashDot: "1px dashed",
  dashDotDot: "1px dashed",
  slantDashDot: "1px dashed",
  mediumDashDot: "2px dashed",
  mediumDashDotDot: "2px dashed",
};

export function fillToBackgroundColor(
  fill: Fill | undefined,
  clrMap: Record<string, string>,
): string | undefined {
  if (!fill || typeof fill !== "object") {
    return undefined;
  }
  if (fill.type === "pattern") {
    if (fill.pattern === "solid" && fill.fgColor) {
      return excelColorToCss(fill.fgColor as OoxmlColorSource, clrMap);
    }
    if (fill.pattern !== "none" && fill.fgColor) {
      const c = excelColorToCss(fill.fgColor as OoxmlColorSource, clrMap);
      if (c) {
        return c;
      }
    }
    if (fill.bgColor) {
      return excelColorToCss(fill.bgColor as OoxmlColorSource, clrMap);
    }
  }
  if (fill.type === "gradient" && Array.isArray(fill.stops) && fill.stops.length > 0) {
    return excelColorToCss(fill.stops[0].color as OoxmlColorSource, clrMap);
  }
  return undefined;
}

function borderSideToCss(
  side: Partial<Border> | undefined,
  clrMap: Record<string, string>,
): string | undefined {
  if (!side?.style) {
    return undefined;
  }
  const widthStyle = BORDER_STYLE_CSS[side.style] || "1px solid";
  const col = excelColorToCss(side.color as OoxmlColorSource, clrMap) || "#000000";
  return `${widthStyle} ${col}`;
}

export function bordersToSides(
  border: Partial<Borders> | undefined,
  clrMap: Record<string, string>,
): Pick<
  ExcelTableCellStyle,
  "borderTop" | "borderRight" | "borderBottom" | "borderLeft"
> {
  if (!border) {
    return {};
  }
  return {
    borderTop: borderSideToCss(border.top, clrMap),
    borderRight: borderSideToCss(border.right, clrMap),
    borderBottom: borderSideToCss(border.bottom, clrMap),
    borderLeft: borderSideToCss(border.left, clrMap),
  };
}

function horizontalToTextAlign(
  h: Alignment["horizontal"] | undefined,
): ExcelTableCellStyle["textAlign"] | undefined {
  if (!h || h === "fill" || h === "centerContinuous" || h === "distributed") {
    return undefined;
  }
  if (h === "justify") {
    return "justify";
  }
  if (h === "left" || h === "center" || h === "right") {
    return h;
  }
  return undefined;
}

function verticalToCss(
  v: Alignment["vertical"] | undefined,
): ExcelTableCellStyle["verticalAlign"] | undefined {
  if (!v || v === "distributed" || v === "justify") {
    return undefined;
  }
  if (v === "top" || v === "middle" || v === "bottom") {
    return v;
  }
  return undefined;
}

export function fontAndAlignmentToStyle(
  font: Partial<Font> | undefined,
  alignment: Partial<Alignment> | undefined,
  clrMap: Record<string, string>,
): Partial<ExcelTableCellStyle> {
  const out: Partial<ExcelTableCellStyle> = {};
  if (font?.name) {
    out.fontFamily = String(font.name);
  }
  if (typeof font?.size === "number" && font.size > 0) {
    out.fontSize = `${font.size}pt`;
  }
  if (font?.bold === true) {
    out.fontWeight = "bold";
  }
  if (font?.italic === true) {
    out.fontStyle = "italic";
  }
  const fg = excelColorToCss(font?.color as OoxmlColorSource, clrMap);
  if (fg) {
    out.color = fg;
  }
  const ta = horizontalToTextAlign(alignment?.horizontal);
  if (ta) {
    out.textAlign = ta;
  }
  const va = verticalToCss(alignment?.vertical);
  if (va) {
    out.verticalAlign = va;
  }
  return out;
}

export function excelStyleLayersToCellStyle(options: {
  fill?: Fill;
  font?: Partial<Font>;
  alignment?: Partial<Alignment>;
  border?: Partial<Borders>;
  clrMap: Record<string, string>;
}): ExcelTableCellStyle | null {
  const fromFont = fontAndAlignmentToStyle(options.font, options.alignment, options.clrMap);
  const bg = fillToBackgroundColor(options.fill, options.clrMap);
  const sides = bordersToSides(options.border, options.clrMap);
  const merged: ExcelTableCellStyle = {
    ...fromFont,
    ...(bg ? { backgroundColor: bg } : {}),
    ...sides,
  };
  return Object.keys(merged).length > 0 ? merged : null;
}

export function excelCellToTableStyle(cell: Cell): ExcelTableCellStyle | null {
  const s = cell.style;
  if (!s) {
    return null;
  }
  const clrMap = getWorkbookClrSchemeMap(cell.workbook);
  return excelStyleLayersToCellStyle({
    fill: s.fill,
    font: s.font,
    alignment: s.alignment,
    border: s.border,
    clrMap,
  });
}

/** Escala apenas `fontSize` (pt ou px) para pré-visualização / exportação de tabelas linkadas. */
export function scaleExcelCellStyleFontSize(
  style: ExcelTableCellStyle,
  scale: number,
): ExcelTableCellStyle {
  if (scale === 1 || !style.fontSize) {
    return style;
  }
  const pt = /^(\d+(?:\.\d+)?)pt$/i.exec(style.fontSize);
  if (pt) {
    const n = Math.round(parseFloat(pt[1]) * scale * 100) / 100;
    return { ...style, fontSize: `${n}pt` };
  }
  const px = /^(\d+(?:\.\d+)?)px$/i.exec(style.fontSize);
  if (px) {
    const n = Math.round(parseFloat(px[1]) * scale * 100) / 100;
    return { ...style, fontSize: `${n}px` };
  }
  return style;
}

export function cellStyleToCssString(style: ExcelTableCellStyle): string {
  const parts: string[] = [];
  if (style.color) {
    parts.push(`color:${style.color}`);
  }
  if (style.backgroundColor) {
    parts.push(`background-color:${style.backgroundColor}`);
  }
  if (style.fontFamily) {
    parts.push(`font-family:${style.fontFamily}`);
  }
  if (style.fontSize) {
    parts.push(`font-size:${style.fontSize}`);
  }
  if (style.fontWeight) {
    parts.push(`font-weight:${style.fontWeight}`);
  }
  if (style.fontStyle) {
    parts.push(`font-style:${style.fontStyle}`);
  }
  if (style.textAlign) {
    parts.push(`text-align:${style.textAlign}`);
  }
  if (style.verticalAlign) {
    parts.push(`vertical-align:${style.verticalAlign}`);
  }
  if (style.borderTop) {
    parts.push(`border-top:${style.borderTop}`);
  }
  if (style.borderRight) {
    parts.push(`border-right:${style.borderRight}`);
  }
  if (style.borderBottom) {
    parts.push(`border-bottom:${style.borderBottom}`);
  }
  if (style.borderLeft) {
    parts.push(`border-left:${style.borderLeft}`);
  }
  return parts.join(";");
}

export function escapeHtmlStyleAttr(css: string): string {
  return String(css).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}
