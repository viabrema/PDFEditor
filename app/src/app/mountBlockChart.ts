import { getChartContent, isChartConfigured } from "../blocks/chartBlock";
import { resolveChartTableData } from "../blocks/chartDataFromTableBlock";
import { applyChartFontScale, buildChartJsConfiguration } from "../blocks/chartSpecToChartJs";
import { validateChartConfiguration } from "../blocks/chartValidation";
import {
  destroyBlockChart,
  mountChartForBlock,
  resizeBlockChart,
} from "../blocks/chartRuntime";
import type { FloatingToolbarHandle } from "./renderFloatingToolbar";

export function scheduleChartJsMountIfConfigured(options: {
  block: any;
  element: HTMLElement;
  blocksForChartResolve: any[];
  pushInteraction: (h: FloatingToolbarHandle) => void;
}): void {
  const { block, element, blocksForChartResolve, pushInteraction } = options;
  if (block.type !== "chart" || !isChartConfigured(block)) {
    return;
  }
  const canvas = element.querySelector("canvas.chart-block-canvas") as HTMLCanvasElement | null;
  if (!canvas) {
    return;
  }
  const content = getChartContent(block);
  const resolved = resolveChartTableData(blocksForChartResolve, content);
  let cfg = null;
  if (resolved.ok) {
    const v = validateChartConfiguration(content, resolved.data);
    if (v.ok) {
      let built = buildChartJsConfiguration(content, resolved.data);
      if (built && block.metadata?.fontScale != null) {
        built = applyChartFontScale(built, block.metadata.fontScale);
      }
      cfg = built;
    }
  }
  if (!cfg) {
    return;
  }
  const mount = () => {
    mountChartForBlock({
      blockId: block.id,
      canvas,
      config: cfg,
      onPreview: (url) => {
        block.content = { ...block.content, previewDataUrl: url };
      },
    });
  };
  requestAnimationFrame(() => {
    mount();
  });
  const ro = new ResizeObserver(() => {
    resizeBlockChart(block.id);
  });
  ro.observe(element);
  pushInteraction({
    destroy() {
      ro.disconnect();
      destroyBlockChart(block.id);
    },
    setEnabled() {},
  });
}
