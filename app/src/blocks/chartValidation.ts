import type { ChartBlockContent, ChartDatasetSpec } from "./chartBlockTypes";
import type { ResolvedTableData } from "./chartDataFromTableBlock";

function inRange(idx: number, cols: number): boolean {
  return Number.isInteger(idx) && idx >= 0 && idx < cols;
}

function checkMappingColumns(ds: ChartDatasetSpec, columnCount: number): string | null {
  const m = ds.mapping;
  if (!inRange(m.xColumnIndex, columnCount)) {
    return `Serie "${ds.label}": coluna X invalida.`;
  }
  if (!inRange(m.yColumnIndex, columnCount)) {
    return `Serie "${ds.label}": coluna Y invalida.`;
  }
  const needOhlc = (i?: number) => i === undefined || inRange(i, columnCount);
  if (
    m.openColumnIndex !== undefined &&
    !needOhlc(m.openColumnIndex) &&
    m.openColumnIndex >= 0
  ) {
    return `Serie "${ds.label}": coluna Open invalida.`;
  }
  if (m.highColumnIndex !== undefined && !inRange(m.highColumnIndex, columnCount)) {
    return `Serie "${ds.label}": coluna High invalida.`;
  }
  if (m.lowColumnIndex !== undefined && !inRange(m.lowColumnIndex, columnCount)) {
    return `Serie "${ds.label}": coluna Low invalida.`;
  }
  if (m.closeColumnIndex !== undefined && !inRange(m.closeColumnIndex, columnCount)) {
    return `Serie "${ds.label}": coluna Close invalida.`;
  }
  if (m.rColumnIndex !== undefined && !inRange(m.rColumnIndex, columnCount)) {
    return `Serie "${ds.label}": coluna R (raio) invalida.`;
  }
  return null;
}

const MIXABLE = new Set(["line", "bar"]);

/**
 * Valida especificação + dados resolvidos antes de aplicar no Chart.js.
 */
export function validateChartConfiguration(
  content: ChartBlockContent,
  resolved: ResolvedTableData,
): { ok: true } | { ok: false; message: string } {
  const hasEmbedded =
    Array.isArray(content.dataSourceRows) &&
    content.dataSourceRows.length > 0 &&
    content.dataSourceRows.some((r) =>
      Array.isArray(r) && r.some((c) => String(c ?? "").trim() !== ""),
    );
  if (!hasEmbedded && !content.dataSourceBlockId) {
    return { ok: false, message: "Preencha a grelha na aba Fonte de dados." };
  }
  if (resolved.columnCount < 1) {
    return { ok: false, message: "A fonte nao tem colunas." };
  }
  if (resolved.dataRows.length < 1) {
    return { ok: false, message: "Nao ha linhas de dados (alem do cabecalho, se ativo)." };
  }

  const { chart } = content;
  if (!chart.datasets || chart.datasets.length === 0) {
    return { ok: false, message: "Adicione pelo menos uma serie." };
  }

  const base = chart.baseType;

  if (base === "candlestick") {
    const ds = chart.datasets[0];
    if (!ds) {
      return { ok: false, message: "Candlestick precisa de uma serie com colunas OHLC." };
    }
    const m = ds.mapping;
    if (
      m.openColumnIndex === undefined ||
      m.highColumnIndex === undefined ||
      m.lowColumnIndex === undefined ||
      m.closeColumnIndex === undefined
    ) {
      return {
        ok: false,
        message: "Defina as colunas Open, High, Low e Close para candlestick.",
      };
    }
  }

  if (base === "bubble") {
    for (const ds of chart.datasets) {
      if (ds.mapping.rColumnIndex === undefined) {
        return { ok: false, message: `Bubble: serie "${ds.label}" precisa de coluna R (raio).` };
      }
    }
  }

  for (const ds of chart.datasets) {
    const err = checkMappingColumns(ds, resolved.columnCount);
    if (err) {
      return { ok: false, message: err };
    }
  }

  // Mistura: só combinações line/bar (e area via line fill) por defeito
  for (const ds of chart.datasets) {
    const t = ds.type || base;
    if (t !== base && !(MIXABLE.has(base) && MIXABLE.has(t))) {
      return {
        ok: false,
        message: `Tipo misto nao suportado: base "${base}" com serie "${ds.label}" tipo "${t}". Use line/bar ou defina o mesmo tipo.`,
      };
    }
  }

  if ((base === "pie" || base === "doughnut" || base === "polarArea") && chart.datasets.length > 1) {
    return {
      ok: false,
      message: "Pie/doughnut/polarArea suportam uma serie nesta versao.",
    };
  }

  return { ok: true };
}
