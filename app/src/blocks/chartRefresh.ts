import { getChartContent } from "./chartBlock";
import { resolveChartTableData } from "./chartDataFromTableBlock";
import { buildChartJsConfiguration } from "./chartSpecToChartJs";
import { validateChartConfiguration } from "./chartValidation";
import { updateChartDataFromConfig } from "./chartRuntime";

/**
 * Atualiza todos os gráficos que usam `sourceTableBlockId` como fonte (apos refresh Excel, etc.).
 */
export function refreshChartsUsingTableBlock(sourceTableBlockId: string, blocks: any[]): void {
  for (const b of blocks) {
    if (b.type !== "chart") {
      continue;
    }
    const content = getChartContent(b);
    if (content.dataSourceBlockId !== sourceTableBlockId) {
      continue;
    }
    if (!content.configured) {
      continue;
    }
    const resolved = resolveChartTableData(blocks, content);
    if (!resolved.ok) {
      continue;
    }
    const v = validateChartConfiguration(content, resolved.data);
    if (!v.ok) {
      continue;
    }
    const cfg = buildChartJsConfiguration(content, resolved.data);
    if (!cfg) {
      continue;
    }
    updateChartDataFromConfig(b.id, cfg, (url) => {
      b.content = { ...b.content, previewDataUrl: url };
    });
  }
}
