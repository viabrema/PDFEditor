import type { Color, Workbook } from "exceljs";

/**
 * Cor OOXML no modelo ExcelJS (argb/theme/indexed/tint). Os tipos oficiais
 * de `Color` nao incluem `indexed` nem `tint`, mas o parser preenche-os.
 */
export type OoxmlColorSource = Partial<Color> & { indexed?: number; tint?: number };

/** OOXML theme attribute (0-based) -> clrScheme child tag (Office / Excel ordering). */
const THEME_INDEX_TO_TAG = [
  "lt1",
  "dk1",
  "lt2",
  "dk2",
  "accent1",
  "accent2",
  "accent3",
  "accent4",
  "accent5",
  "accent6",
  "hlink",
  "folHlink",
] as const;

/** Fallback quando o ficheiro nao traz theme1.xml (tema Office por defeito). */
const DEFAULT_CLR_SCHEME: Record<string, string> = {
  dk1: "000000",
  lt1: "FFFFFF",
  dk2: "1F497D",
  lt2: "EEECE1",
  accent1: "4F81BD",
  accent2: "C0504D",
  accent3: "9BBB59",
  accent4: "8064A2",
  accent5: "4BACC6",
  accent6: "F79646",
  hlink: "0000FF",
  folHlink: "800080",
};

/** ST_IndexedColor 0..63 (ECMA-376). Indices 64-65 reservados. */
const INDEXED_COLORS: readonly string[] = [
  "000000",
  "FFFFFF",
  "FF0000",
  "00FF00",
  "0000FF",
  "FFFF00",
  "FF00FF",
  "00FFFF",
  "000000",
  "FFFFFF",
  "FF0000",
  "00FF00",
  "0000FF",
  "FFFF00",
  "FF00FF",
  "00FFFF",
  "800000",
  "008000",
  "000080",
  "808000",
  "800080",
  "008080",
  "C0C0C0",
  "808080",
  "9999FF",
  "993366",
  "FFFFCC",
  "CCFFFF",
  "660066",
  "FF8080",
  "0066CC",
  "CCCCFF",
  "000080",
  "FF00FF",
  "FFFF00",
  "00FFFF",
  "800080",
  "800000",
  "008080",
  "0000FF",
  "00CCFF",
  "CCFFFF",
  "CCFFCC",
  "FFFF99",
  "99CCFF",
  "FF99CC",
  "CC99FF",
  "FFCC99",
  "3366FF",
  "33CCCC",
  "99CC00",
  "FFCC00",
  "FF9900",
  "FF6600",
  "666699",
  "969696",
  "003366",
  "339966",
  "003300",
  "333300",
  "993300",
  "993366",
  "333399",
  "333333",
];

type WorkbookWithThemes = Workbook & { _themes?: Record<string, string> };

const themeMapCache = new WeakMap<Workbook, Record<string, string>>();

function extractClrInner(xml: string, tag: string): string | undefined {
  const re = new RegExp(
    `<(?:[\\w]+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:[\\w]+:)?${tag}>`,
    "i",
  );
  const m = xml.match(re);
  if (!m) {
    return undefined;
  }
  const inner = m[1];
  const srgb = inner.match(/srgbClr[^>]*\bval="([0-9A-Fa-f]{6})"/i);
  if (srgb) {
    return srgb[1].toUpperCase();
  }
  const sys = inner.match(/sysClr[^>]*\blastClr="([0-9A-Fa-f]{6})"/i);
  if (sys) {
    return sys[1].toUpperCase();
  }
  return undefined;
}

/** Extrai dk1/lt1/... do theme1.xml (fragmento OOXML). */
export function parseThemeClrScheme(xml: string): Record<string, string> {
  const tags = [
    "dk1",
    "lt1",
    "dk2",
    "lt2",
    "accent1",
    "accent2",
    "accent3",
    "accent4",
    "accent5",
    "accent6",
    "hlink",
    "folHlink",
  ] as const;
  const out: Record<string, string> = {};
  for (const t of tags) {
    const hex = extractClrInner(xml, t);
    if (hex) {
      out[t] = hex;
    }
  }
  return out;
}

export function getWorkbookClrSchemeMap(workbook: Workbook): Record<string, string> {
  const cached = themeMapCache.get(workbook);
  if (cached) {
    return cached;
  }
  const themes = (workbook as WorkbookWithThemes)._themes;
  let xml: string | undefined;
  if (themes && typeof themes === "object") {
    xml = themes.theme1 || themes[Object.keys(themes)[0] || ""];
  }
  const parsed = xml ? parseThemeClrScheme(xml) : {};
  const merged: Record<string, string> = { ...DEFAULT_CLR_SCHEME, ...parsed };
  themeMapCache.set(workbook, merged);
  return merged;
}

function hex6FromArgb(argb: string): string | undefined {
  const hex = argb.replace(/^#/, "").toUpperCase();
  if (hex.length === 8) {
    return hex.slice(2);
  }
  if (hex.length === 6) {
    return hex;
  }
  return undefined;
}

export function argbToCss(color: Partial<Color> | undefined): string | undefined {
  if (!color) {
    return undefined;
  }
  const argb = color.argb;
  if (typeof argb !== "string" || argb.length < 6) {
    return undefined;
  }
  const body = hex6FromArgb(argb);
  return body ? `#${body}` : undefined;
}

function applyTintToRgb6(rgb6: string, tint: number): string {
  const r = parseInt(rgb6.slice(0, 2), 16);
  const g = parseInt(rgb6.slice(2, 4), 16);
  const b = parseInt(rgb6.slice(4, 6), 16);
  let nr: number;
  let ng: number;
  let nb: number;
  if (tint < 0) {
    const f = 1 + tint;
    nr = Math.round(r * f);
    ng = Math.round(g * f);
    nb = Math.round(b * f);
  } else {
    nr = Math.round(r + (255 - r) * tint);
    ng = Math.round(g + (255 - g) * tint);
    nb = Math.round(b + (255 - b) * tint);
  }
  const clamp = (x: number) => Math.max(0, Math.min(255, x));
  const h = (n: number) => clamp(n).toString(16).padStart(2, "0").toUpperCase();
  return `${h(nr)}${h(ng)}${h(nb)}`;
}

function themeIndexToRgb6(themeIndex: number, clrMap: Record<string, string>): string | undefined {
  const tag = THEME_INDEX_TO_TAG[themeIndex];
  if (!tag) {
    return undefined;
  }
  const raw = clrMap[tag];
  return raw ? raw.toUpperCase() : undefined;
}

function indexedToRgb6(index: number): string | undefined {
  if (index === 64 || index === 65) {
    return undefined;
  }
  if (index < 0 || index >= INDEXED_COLORS.length) {
    return undefined;
  }
  return INDEXED_COLORS[index];
}

/** Converte cor OOXML (argb | theme+tint | indexed) para #RRGGBB. */
export function excelColorToCss(
  color: OoxmlColorSource | undefined,
  clrMap: Record<string, string>,
): string | undefined {
  if (!color) {
    return undefined;
  }
  const direct = argbToCss(color);
  if (direct) {
    return direct;
  }
  if (typeof color.indexed === "number") {
    const rgb = indexedToRgb6(color.indexed);
    return rgb ? `#${rgb}` : undefined;
  }
  if (typeof color.theme === "number") {
    let rgb6 = themeIndexToRgb6(color.theme, clrMap);
    if (!rgb6) {
      return undefined;
    }
    if (typeof color.tint === "number" && color.tint !== 0) {
      rgb6 = applyTintToRgb6(rgb6, color.tint);
    }
    return `#${rgb6}`;
  }
  return undefined;
}
