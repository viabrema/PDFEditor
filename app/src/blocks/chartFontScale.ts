import type { ChartConfiguration } from "chart.js";
import { clampLinkedTableFontScale } from "./tableBlock";

/** Ajusta tamanhos de fonte de legenda, titulo e eixos (graficos linkados com escala na toolbar). */
export function applyChartFontScale(cfg: ChartConfiguration, rawScale: unknown): ChartConfiguration {
  const scale = clampLinkedTableFontScale(rawScale);
  if (scale === 1) {
    return cfg;
  }
  const next = JSON.parse(JSON.stringify(cfg)) as ChartConfiguration;
  const tickSize = Math.round(11 * scale);
  const legendSize = Math.round(11 * scale);
  const titleSize = Math.round(13 * scale);
  const opts = next.options || (next.options = {});
  const plugins = opts.plugins || (opts.plugins = {});
  if (plugins.legend && typeof plugins.legend === "object") {
    const leg = plugins.legend as { labels?: { font?: { size?: number } } };
    leg.labels = leg.labels || {};
    leg.labels.font = { ...(leg.labels.font || {}), size: legendSize };
  }
  if (plugins.title && typeof plugins.title === "object") {
    const t = plugins.title as { display?: boolean; font?: { size?: number } };
    if (t.display) {
      t.font = { ...(t.font || {}), size: titleSize };
    }
  }
  const scales = opts.scales as Record<string, { ticks?: { font?: { size?: number } } }> | undefined;
  if (scales && typeof scales === "object") {
    for (const key of Object.keys(scales)) {
      const sc = scales[key];
      if (sc?.ticks) {
        sc.ticks.font = { ...(sc.ticks.font || {}), size: tickSize };
      }
    }
  }
  return next;
}
