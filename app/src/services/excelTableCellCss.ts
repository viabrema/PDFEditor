import type { ExcelTableCellStyle } from "./excelTableStyle";

const PRINT_BORDER_KEYS = ["borderTop", "borderRight", "borderBottom", "borderLeft"] as const;

function isPrintBorderCss(value: string | undefined): value is string {
  return Boolean(value && value !== "none");
}

/** Converte borda CSS (ex. `1px solid #000`) em box-shadow inset para o canvas (evita conflitos com border-collapse). */
export function printBorderToInsetShadow(
  borderCss: string,
  side: "top" | "right" | "bottom" | "left",
): string | null {
  const match = borderCss.trim().match(/^([\d.]+px)\s+\S+\s+(.+)$/);
  if (!match) {
    return null;
  }
  const width = parseFloat(match[1]);
  const color = match[2];
  if (side === "top") {
    return `inset 0 ${width}px 0 0 ${color}`;
  }
  if (side === "bottom") {
    return `inset 0 -${width}px 0 0 ${color}`;
  }
  if (side === "left") {
    return `inset ${width}px 0 0 0 ${color}`;
  }
  return `inset -${width}px 0 0 0 ${color}`;
}

function appendStyleParts(parts: string[], style: ExcelTableCellStyle) {
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
}

export function appendBorderCssParts(parts: string[], style: ExcelTableCellStyle) {
  if (isPrintBorderCss(style.borderTop)) {
    parts.push(`border-top:${style.borderTop}`);
  }
  if (isPrintBorderCss(style.borderRight)) {
    parts.push(`border-right:${style.borderRight}`);
  }
  if (isPrintBorderCss(style.borderBottom)) {
    parts.push(`border-bottom:${style.borderBottom}`);
  }
  if (isPrintBorderCss(style.borderLeft)) {
    parts.push(`border-left:${style.borderLeft}`);
  }
}

function appendEditorBorderShadowParts(parts: string[], style: ExcelTableCellStyle) {
  const shadows: string[] = [];
  if (isPrintBorderCss(style.borderTop)) {
    const shadow = printBorderToInsetShadow(style.borderTop, "top");
    if (shadow) {
      shadows.push(shadow);
    }
  }
  if (isPrintBorderCss(style.borderRight)) {
    const shadow = printBorderToInsetShadow(style.borderRight, "right");
    if (shadow) {
      shadows.push(shadow);
    }
  }
  if (isPrintBorderCss(style.borderBottom)) {
    const shadow = printBorderToInsetShadow(style.borderBottom, "bottom");
    if (shadow) {
      shadows.push(shadow);
    }
  }
  if (isPrintBorderCss(style.borderLeft)) {
    const shadow = printBorderToInsetShadow(style.borderLeft, "left");
    if (shadow) {
      shadows.push(shadow);
    }
  }
  if (shadows.length > 0) {
    parts.push(`box-shadow:${shadows.join(",")}`);
  }
}

export function cellStyleBaseToCssString(style: ExcelTableCellStyle): string {
  const parts: string[] = [];
  appendStyleParts(parts, style);
  return parts.join(";");
}

/** Estilo inline no canvas: bordas de impressao via box-shadow; grelha cinza fica no CSS da tabela. */
export function cellStyleToEditorCssString(style: ExcelTableCellStyle): string {
  const parts: string[] = [];
  appendStyleParts(parts, style);
  appendEditorBorderShadowParts(parts, style);
  return parts.join(";");
}

export function clearPrintBorderSides(style: Partial<ExcelTableCellStyle>): Partial<ExcelTableCellStyle> {
  const next = { ...style };
  for (const key of PRINT_BORDER_KEYS) {
    delete next[key];
  }
  return next;
}
