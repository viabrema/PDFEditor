import type { ChartBaseType, ChartBlockContent } from "../blocks/chartBlockTypes";
import { defaultChartSpec } from "../blocks/chartBlockTypes";
import { resolveChartTableData } from "../blocks/chartDataFromTableBlock";
import { validateChartConfiguration } from "../blocks/chartValidation";
import { createId } from "../utils/id";
import { cloneChartContent } from "./chartModalClone";
import {
  readDataGridFromDom,
  readWorkingFromForm,
  renderDataGrid,
  renderDatasetEditors,
} from "./chartModalUi";

const BASE_TYPES: { value: ChartBaseType; label: string }[] = [
  { value: "line", label: "Linha" },
  { value: "bar", label: "Barras" },
  { value: "pie", label: "Circular (pie)" },
  { value: "doughnut", label: "Rosquinha" },
  { value: "radar", label: "Radar" },
  { value: "polarArea", label: "Area polar" },
  { value: "scatter", label: "Dispersao" },
  { value: "bubble", label: "Bolha" },
  { value: "candlestick", label: "Candlestick (OHLC)" },
];

let modalController: { open: (block: any) => void } | null = null;

export function openChartConfiguration(block: any) {
  modalController?.open(block);
}

export function bindChartModal(options: {
  refs: Record<string, HTMLElement | null>;
  blocks: any[];
  documentData: any;
  state: any;
  renderer: { renderCanvas: () => void };
  documentHistory?: { checkpointBeforeChange: () => void };
}) {
  const { refs, blocks, renderer, documentHistory } = options;
  const modal = refs.chartConfigModal as HTMLElement | null;
  if (!modal) {
    return;
  }

  const baseTypeEl = refs.chartConfigBaseType as HTMLSelectElement | null;
  if (baseTypeEl && baseTypeEl.options.length === 0) {
    BASE_TYPES.forEach((bt) => {
      const o = document.createElement("option");
      o.value = bt.value;
      o.textContent = bt.label;
      baseTypeEl.append(o);
    });
  }

  const tabData = refs.chartConfigTabData as HTMLButtonElement | null;
  const tabInterface = refs.chartConfigTabInterface as HTMLButtonElement | null;
  const panelData = refs.chartConfigPanelData as HTMLElement | null;
  const panelInterface = refs.chartConfigPanelInterface as HTMLElement | null;
  const dataGridHost = refs.chartConfigDataGrid as HTMLElement | null;

  const el = {
    firstRow: refs.chartConfigFirstRowHeader as HTMLInputElement | null,
    baseType: refs.chartConfigBaseType as HTMLSelectElement | null,
    chartTitle: refs.chartConfigChartTitle as HTMLInputElement | null,
    legend: refs.chartConfigLegend as HTMLInputElement | null,
    yRight: refs.chartConfigYRight as HTMLInputElement | null,
    datasets: refs.chartConfigDatasets as HTMLElement | null,
    error: refs.chartConfigModalError as HTMLElement | null,
    addDataset: refs.chartConfigAddDataset as HTMLButtonElement | null,
  };

  let editingBlock: any = null;
  let working: ChartBlockContent = cloneChartContent(null);
  let activeTab: "data" | "interface" = "data";

  function show() {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    modal.setAttribute("aria-hidden", "false");
  }

  function hide() {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    modal.setAttribute("aria-hidden", "true");
    editingBlock = null;
    if (el.error) {
      el.error.textContent = "";
    }
  }

  function setTab(tab: "data" | "interface") {
    activeTab = tab;
    const on = "rounded-md px-3 py-1.5 text-sm font-semibold text-slate-900 bg-slate-100";
    const off = "rounded-md px-3 py-1.5 text-sm font-semibold text-slate-500";
    if (tabData) {
      tabData.className = `chart-config-tab ${tab === "data" ? on : off}`;
    }
    if (tabInterface) {
      tabInterface.className = `chart-config-tab ${tab === "interface" ? on : off}`;
    }
    if (panelData) {
      panelData.classList.toggle("hidden", tab !== "data");
    }
    if (panelInterface) {
      panelInterface.classList.toggle("hidden", tab !== "interface");
    }
  }

  function paintDatasetEditors() {
    renderDatasetEditors(el.datasets, working, (index) => {
      working.chart.datasets.splice(index, 1);
      if (working.chart.datasets.length === 0) {
        working.chart.datasets = defaultChartSpec().datasets;
      }
      paintDatasetEditors();
    });
  }

  function syncFormFromWorking() {
    if (el.firstRow) {
      el.firstRow.checked = working.firstRowIsHeader !== false;
    }
    if (el.baseType) {
      el.baseType.value = working.chart.baseType;
    }
    if (el.chartTitle) {
      el.chartTitle.value = working.chart.title?.text || "";
    }
    if (el.legend) {
      el.legend.checked = working.chart.legendDisplay !== false;
    }
    if (el.yRight) {
      el.yRight.checked = working.chart.yAxisRight === true;
    }
    renderDataGrid(dataGridHost, working);
    paintDatasetEditors();
  }

  el.baseType?.addEventListener("change", () => {
    working.chart.baseType = (el.baseType!.value || "line") as ChartBaseType;
    paintDatasetEditors();
  });

  el.addDataset?.addEventListener("click", () => {
    const last = working.chart.datasets[working.chart.datasets.length - 1];
    working.chart.datasets.push({
      id: createId("cds"),
      label: `Serie ${working.chart.datasets.length + 1}`,
      mapping: {
        xColumnIndex: last?.mapping.xColumnIndex ?? 0,
        yColumnIndex: Math.min((last?.mapping.yColumnIndex ?? 0) + 1, 20),
      },
      style: {
        borderColor: "#2563eb",
        fill: false,
        tension: 0.25,
      },
    });
    paintDatasetEditors();
  });

  tabData?.addEventListener("click", () => setTab("data"));
  tabInterface?.addEventListener("click", () => setTab("interface"));

  (refs.chartConfigAddGridRow as HTMLButtonElement | null)?.addEventListener("click", () => {
    working.dataSourceRows = readDataGridFromDom(dataGridHost, working);
    const cols = Math.max(1, ...working.dataSourceRows.map((r) => r.length));
    working.dataSourceRows.push(Array(cols).fill(""));
    renderDataGrid(dataGridHost, working);
  });

  (refs.chartConfigAddGridCol as HTMLButtonElement | null)?.addEventListener("click", () => {
    working.dataSourceRows = readDataGridFromDom(dataGridHost, working);
    working.dataSourceRows = working.dataSourceRows.map((r) => [...r, ""]);
    renderDataGrid(dataGridHost, working);
  });

  (refs.chartConfigRemoveGridRow as HTMLButtonElement | null)?.addEventListener("click", () => {
    working.dataSourceRows = readDataGridFromDom(dataGridHost, working);
    if (working.dataSourceRows.length <= 1) {
      return;
    }
    working.dataSourceRows.pop();
    renderDataGrid(dataGridHost, working);
  });

  (refs.chartConfigRemoveGridCol as HTMLButtonElement | null)?.addEventListener("click", () => {
    working.dataSourceRows = readDataGridFromDom(dataGridHost, working);
    const cols = Math.max(1, ...working.dataSourceRows.map((r) => r.length));
    if (cols <= 1) {
      return;
    }
    working.dataSourceRows = working.dataSourceRows.map((r) => r.slice(0, -1));
    renderDataGrid(dataGridHost, working);
  });

  modalController = {
    open(block: any) {
      editingBlock = block;
      working = cloneChartContent(block.content);
      setTab("data");
      syncFormFromWorking();
      show();
    },
  };

  (refs.chartConfigCancel as HTMLButtonElement | null)?.addEventListener("click", hide);
  (refs.chartConfigClose as HTMLButtonElement | null)?.addEventListener("click", hide);
  modal.addEventListener("click", (ev) => {
    if (ev.target === modal) {
      hide();
    }
  });

  (refs.chartConfigApply as HTMLButtonElement | null)?.addEventListener("click", () => {
    if (!editingBlock) {
      return;
    }
    const next = readWorkingFromForm(working, el, dataGridHost);
    const resolved = resolveChartTableData(blocks, next);
    if (resolved.ok === false) {
      if (el.error) {
        el.error.textContent = resolved.message;
      }
      window.alert(resolved.message);
      return;
    }
    const v = validateChartConfiguration(next, resolved.data);
    if (v.ok === false) {
      if (el.error) {
        el.error.textContent = v.message;
      }
      window.alert(v.message);
      return;
    }
    if (el.error) {
      el.error.textContent = "";
    }
    documentHistory?.checkpointBeforeChange();
    editingBlock.content = {
      ...next,
      configured: true,
      dataSourceBlockId: undefined,
    };
    hide();
    renderer.renderCanvas();
  });
}
