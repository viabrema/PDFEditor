import type { ChartConfiguration } from "chart.js";
import type { ChartBlockContent } from "./chartBlockTypes";
import type { ResolvedTableData } from "./chartDataFromTableBlock";
import { buildCandlestickChartConfig } from "./chartJsConfigCandlestick";
import { buildLineBarChartConfig } from "./chartJsConfigLineBar";
import { buildRadialChartConfig } from "./chartJsConfigRadial";
import {
  buildBubbleChartConfig,
  buildScatterChartConfig,
} from "./chartJsConfigScatterBubble";

export { applyChartFontScale } from "./chartFontScale";

export function buildChartJsConfiguration(
  content: ChartBlockContent,
  resolved: ResolvedTableData,
): ChartConfiguration | null {
  const base = content.chart.baseType;

  if (
    base === "pie" ||
    base === "doughnut" ||
    base === "polarArea" ||
    base === "radar"
  ) {
    return buildRadialChartConfig(content, resolved);
  }

  if (base === "candlestick") {
    return buildCandlestickChartConfig(content, resolved);
  }

  if (base === "scatter") {
    return buildScatterChartConfig(content, resolved);
  }

  if (base === "bubble") {
    return buildBubbleChartConfig(content, resolved);
  }

  return buildLineBarChartConfig(content, resolved);
}
