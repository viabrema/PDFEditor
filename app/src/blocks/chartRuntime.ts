import type { ChartConfiguration } from "chart.js";
import { Chart, registerChartJs } from "./chartJsRegister";

const chartByBlockId = new Map<string, Chart>();

let previewTimers = new Map<string, number>();

export function destroyAllBlockCharts(): void {
  for (const chart of chartByBlockId.values()) {
    try {
      chart.destroy();
    } catch {
      /* ignore */
    }
  }
  chartByBlockId.clear();
  previewTimers.forEach((t) => window.clearTimeout(t));
  previewTimers = new Map();
}

export function destroyBlockChart(blockId: string): void {
  const chart = chartByBlockId.get(blockId);
  if (chart) {
    try {
      chart.destroy();
    } catch {
      /* ignore */
    }
    chartByBlockId.delete(blockId);
  }
  const t = previewTimers.get(blockId);
  if (t !== undefined) {
    window.clearTimeout(t);
    previewTimers.delete(blockId);
  }
}

function schedulePreview(blockId: string, chart: Chart, onPreview: (dataUrl: string) => void) {
  const prev = previewTimers.get(blockId);
  if (prev !== undefined) {
    window.clearTimeout(prev);
  }
  const id = window.setTimeout(() => {
    previewTimers.delete(blockId);
    try {
      const url = chart.toBase64Image("image/png", 1);
      onPreview(url);
    } catch {
      /* ignore */
    }
  }, 250);
  previewTimers.set(blockId, id);
}

/**
 * Cria ou substitui Chart no canvas; gera preview PNG debounced para PDF.
 */
export function mountChartForBlock(options: {
  blockId: string;
  canvas: HTMLCanvasElement;
  config: ChartConfiguration;
  onPreview: (dataUrl: string) => void;
}): Chart {
  registerChartJs();
  destroyBlockChart(options.blockId);
  const chart = new Chart(options.canvas, options.config);
  chartByBlockId.set(options.blockId, chart);
  schedulePreview(options.blockId, chart, options.onPreview);
  return chart;
}

export function resizeBlockChart(blockId: string): void {
  chartByBlockId.get(blockId)?.resize();
}

/**
 * Atualiza dados sem remontar o canvas (ex.: apos refresh Excel na fonte).
 */
export function updateChartDataFromConfig(
  blockId: string,
  config: ChartConfiguration | null,
  onPreview?: (dataUrl: string) => void,
): void {
  if (!config) {
    return;
  }
  const chart = chartByBlockId.get(blockId);
  if (!chart) {
    return;
  }
  chart.data = config.data as any;
  if (config.options) {
    chart.options = config.options as any;
  }
  chart.update();
  if (onPreview) {
    schedulePreview(blockId, chart, onPreview);
  }
}
