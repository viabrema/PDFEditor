import { createId } from "../utils/id";
import {
  CHART_SPEC_VERSION,
  defaultChartSpec,
  emptyChartContent,
  type ChartBaseType,
  type ChartBlockContent,
  type ChartDatasetSpec,
  type ChartSpec,
} from "../blocks/chartBlockTypes";
import { normalizeChartDataSourceRows, resolveChartTableData } from "../blocks/chartDataFromTableBlock";
import { validateChartConfiguration } from "../blocks/chartValidation";
import { getChartContent } from "../blocks/chartBlock";

/** Extrai grelha de `dataSourceRows`, `tableRows` ou `content` (formato das acoes de tabela). */
function dataSourceRowsFromAiAction(action: Record<string, unknown>): string[][] | null {
  const raw =
    action.dataSourceRows !== undefined && action.dataSourceRows !== null
      ? action.dataSourceRows
      : action.tableRows !== undefined && action.tableRows !== null
        ? action.tableRows
        : action.content;
  if (raw === undefined || raw === null) {
    return null;
  }
  if (!Array.isArray(raw)) {
    return null;
  }
  if (raw.length === 0) {
    return [];
  }
  if (Array.isArray(raw[0])) {
    return raw.map((row: unknown) =>
      Array.isArray(row) ? row.map((c) => (c == null ? "" : String(c))) : [],
    );
  }
  if (typeof raw[0] === "object" && raw[0] !== null) {
    return raw.map((row: { cells?: unknown }) =>
      Array.isArray(row?.cells) ? row.cells!.map((cell: unknown) => String(cell ?? "")) : [],
    );
  }
  return null;
}

const VALID_BASE = new Set<ChartBaseType>([
  "line",
  "bar",
  "pie",
  "doughnut",
  "radar",
  "polarArea",
  "scatter",
  "bubble",
  "candlestick",
]);

function numOr(m: Record<string, unknown>, key: string, fallback: number): number {
  const v = Number(m[key]);
  return Number.isFinite(v) ? v : fallback;
}

function normalizeDatasetFromAi(ds: unknown, index: number, previous?: ChartDatasetSpec): ChartDatasetSpec {
  const d = (ds && typeof ds === "object" ? ds : {}) as Record<string, unknown>;
  const m = (d.mapping && typeof d.mapping === "object" ? d.mapping : {}) as Record<string, unknown>;
  const st = (d.style && typeof d.style === "object" ? d.style : {}) as Record<string, unknown>;
  const mapping: ChartDatasetSpec["mapping"] = {
    xColumnIndex: numOr(m, "xColumnIndex", 0),
    yColumnIndex: numOr(m, "yColumnIndex", 1),
  };
  const o = Number(m.openColumnIndex);
  const h = Number(m.highColumnIndex);
  const l = Number(m.lowColumnIndex);
  const c = Number(m.closeColumnIndex);
  const r = Number(m.rColumnIndex);
  if (Number.isFinite(o)) {
    mapping.openColumnIndex = o;
  }
  if (Number.isFinite(h)) {
    mapping.highColumnIndex = h;
  }
  if (Number.isFinite(l)) {
    mapping.lowColumnIndex = l;
  }
  if (Number.isFinite(c)) {
    mapping.closeColumnIndex = c;
  }
  if (Number.isFinite(r)) {
    mapping.rColumnIndex = r;
  }

  const style: ChartDatasetSpec["style"] = {};
  if (typeof st.borderColor === "string") {
    style.borderColor = st.borderColor;
  }
  if (typeof st.backgroundColor === "string") {
    style.backgroundColor = st.backgroundColor;
  }
  if (typeof st.fill === "boolean") {
    style.fill = st.fill;
  }
  if (typeof st.tension === "number" && Number.isFinite(st.tension)) {
    style.tension = st.tension;
  }
  if (typeof st.borderWidth === "number" && Number.isFinite(st.borderWidth)) {
    style.borderWidth = st.borderWidth;
  }
  if (typeof st.pointRadius === "number" && Number.isFinite(st.pointRadius)) {
    style.pointRadius = st.pointRadius;
  }

  const typeRaw = d.type;
  const type =
    typeof typeRaw === "string" && VALID_BASE.has(typeRaw as ChartBaseType)
      ? (typeRaw as ChartDatasetSpec["type"])
      : undefined;

  return {
    id: typeof d.id === "string" && d.id ? d.id : previous?.id || createId("cds"),
    label: typeof d.label === "string" && d.label ? d.label : previous?.label || `Serie ${index + 1}`,
    type,
    mapping,
    style: Object.keys(style).length > 0 ? { ...previous?.style, ...style } : previous?.style,
  };
}

function chartSpecFromAiPartial(partial: unknown, previous?: ChartSpec): ChartSpec {
  const prev = previous || defaultChartSpec();
  if (!partial || typeof partial !== "object") {
    return prev;
  }
  const p = partial as Record<string, unknown>;
  const baseType =
    typeof p.baseType === "string" && VALID_BASE.has(p.baseType as ChartBaseType)
      ? (p.baseType as ChartBaseType)
      : prev.baseType;

  const titleIn = p.title && typeof p.title === "object" ? (p.title as Record<string, unknown>) : null;
  const title = {
    text: typeof titleIn?.text === "string" ? titleIn.text : prev.title?.text || "",
    backgroundColor:
      typeof titleIn?.backgroundColor === "string"
        ? titleIn.backgroundColor
        : prev.title?.backgroundColor || "",
    color: typeof titleIn?.color === "string" ? titleIn.color : prev.title?.color || "#0f172a",
  };

  let datasets = prev.datasets;
  if (Array.isArray(p.datasets) && p.datasets.length > 0) {
    datasets = p.datasets.map((row, i) => normalizeDatasetFromAi(row, i, prev.datasets[i]));
  }

  const legendPos = p.legendPosition;
  return {
    version: CHART_SPEC_VERSION,
    baseType,
    title,
    legendDisplay:
      typeof p.legendDisplay === "boolean" ? p.legendDisplay : prev.legendDisplay !== false,
    legendPosition:
      legendPos === "top" ||
      legendPos === "bottom" ||
      legendPos === "left" ||
      legendPos === "right"
        ? legendPos
        : prev.legendPosition || "top",
    yAxisRight: p.yAxisRight === true ? true : prev.yAxisRight === true,
    datasets,
  };
}

export function finalizeChartContentWithValidation(
  blocks: { id: string; type?: string; content?: unknown }[],
  content: ChartBlockContent,
): ChartBlockContent {
  const next: ChartBlockContent = {
    ...content,
    previewDataUrl: undefined,
    dataSourceRows: normalizeChartDataSourceRows(content.dataSourceRows),
  };
  const resolved = resolveChartTableData(blocks, next);
  if (!resolved.ok) {
    return { ...next, configured: false };
  }
  const v = validateChartConfiguration(next, resolved.data);
  if (!v.ok) {
    return { ...next, configured: false };
  }
  return { ...next, configured: true };
}

export function buildChartBlockContentFromAiAction(
  action: Record<string, unknown>,
  blocks: { id: string; type?: string; content?: unknown }[],
): ChartBlockContent {
  const base = emptyChartContent();
  const fromAi = dataSourceRowsFromAiAction(action);
  if (fromAi !== null && fromAi.length > 0) {
    base.dataSourceRows = fromAi;
  }
  if (
    (!base.dataSourceRows || base.dataSourceRows.every((r) => r.every((c) => !String(c).trim()))) &&
    typeof action.dataSourceBlockId === "string" &&
    action.dataSourceBlockId
  ) {
    base.dataSourceBlockId = action.dataSourceBlockId;
  } else {
    base.dataSourceBlockId = undefined;
  }
  base.firstRowIsHeader = action.firstRowIsHeader !== false;
  base.chart = chartSpecFromAiPartial(action.chart, undefined);
  let content = finalizeChartContentWithValidation(blocks, base);
  if (action.configured === false) {
    content = { ...content, configured: false };
  }
  return content;
}

export function mergeChartBlockFromAiUpdate(
  block: { content?: unknown },
  action: Record<string, unknown>,
  blocks: { id: string; type?: string; content?: unknown }[],
): ChartBlockContent {
  const current = getChartContent(block);
  let next: ChartBlockContent = {
    ...current,
    previewDataUrl: undefined,
  };
  const rowsFromAi = dataSourceRowsFromAiAction(action);
  if (rowsFromAi !== null && rowsFromAi.length > 0) {
    next.dataSourceRows = rowsFromAi;
    next.dataSourceBlockId = undefined;
  } else if (action.dataSourceBlockId !== undefined) {
    next.dataSourceBlockId =
      typeof action.dataSourceBlockId === "string" && action.dataSourceBlockId
        ? action.dataSourceBlockId
        : undefined;
  }
  if (action.firstRowIsHeader !== undefined) {
    next.firstRowIsHeader = action.firstRowIsHeader !== false;
  }
  if (action.chart !== undefined && typeof action.chart === "object") {
    next.chart = chartSpecFromAiPartial(action.chart, current.chart);
  }
  next = finalizeChartContentWithValidation(blocks, next);
  if (action.configured === false) {
    next = { ...next, configured: false };
  }
  return next;
}
