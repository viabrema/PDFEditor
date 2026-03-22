import type { Alignment, Border, Borders, Cell, Color, Fill, Font } from "exceljs";

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

export function argbToCss(color: Partial<Color> | undefined): string | undefined {
  if (!color) {
    return undefined;
  }
  const argb = color.argb;
  if (typeof argb !== "string" || argb.length < 6) {
    return undefined;
  }
  const hex = argb.replace(/^#/, "").toUpperCase();
  if (hex.length === 8) {
    return `#${hex.slice(2)}`;
  }
  if (hex.length === 6) {
    return `#${hex}`;
  }
  return undefined;
}

export function fillToBackgroundColor(fill: Fill | undefined): string | undefined {
  if (!fill || typeof fill !== "object") {
    return undefined;
  }
  if (fill.type === "pattern") {
    if (fill.pattern === "solid" && fill.fgColor) {
      return argbToCss(fill.fgColor);
    }
    if (fill.pattern !== "none" && fill.fgColor) {
      const c = argbToCss(fill.fgColor);
      if (c) {
        return c;
      }
    }
    if (fill.bgColor) {
      return argbToCss(fill.bgColor);
    }
  }
  if (fill.type === "gradient" && Array.isArray(fill.stops) && fill.stops.length > 0) {
    return argbToCss(fill.stops[0].color);
  }
  return undefined;
}

function borderSideToCss(side: Partial<Border> | undefined): string | undefined {
  if (!side?.style) {
    return undefined;
  }
  const widthStyle = BORDER_STYLE_CSS[side.style] || "1px solid";
  const col = argbToCss(side.color) || "#000000";
  return `${widthStyle} ${col}`;
}

export function bordersToSides(border: Partial<Borders> | undefined): Pick<
  ExcelTableCellStyle,
  "borderTop" | "borderRight" | "borderBottom" | "borderLeft"
> {
  if (!border) {
    return {};
  }
  return {
    borderTop: borderSideToCss(border.top),
    borderRight: borderSideToCss(border.right),
    borderBottom: borderSideToCss(border.bottom),
    borderLeft: borderSideToCss(border.left),
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
  const fg = argbToCss(font?.color);
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
}): ExcelTableCellStyle | null {
  const fromFont = fontAndAlignmentToStyle(options.font, options.alignment);
  const bg = fillToBackgroundColor(options.fill);
  const sides = bordersToSides(options.border);
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
  return excelStyleLayersToCellStyle({
    fill: s.fill,
    font: s.font,
    alignment: s.alignment,
    border: s.border,
  });
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
