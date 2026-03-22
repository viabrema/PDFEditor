import { effectiveBlockLanguageId } from "./translationFlow";
import type {
  ChartBlockContent,
  ChartDatasetSpec,
  ChartBaseType,
} from "../blocks/chartBlockTypes";
import { defaultChartSpec, emptyChartContent } from "../blocks/chartBlockTypes";
import { CHART_PALETTE_HEX } from "../blocks/chartPalette";
import { resolveChartTableData } from "../blocks/chartDataFromTableBlock";
import { validateChartConfiguration } from "../blocks/chartValidation";
import { createId } from "../utils/id";

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

const DATASET_TYPE_OPTIONS = [
  { value: "", label: "Igual ao grafico" },
  { value: "line", label: "Linha" },
  { value: "bar", label: "Barras" },
];

let modalController: { open: (block: any) => void } | null = null;

export function openChartConfiguration(block: any) {
  modalController?.open(block);
}

function cloneChartContent(raw: unknown): ChartBlockContent {
  const base = emptyChartContent();
  if (!raw || typeof raw !== "object") {
    return base;
  }
  const c = raw as ChartBlockContent;
  try {
    const d0 = defaultChartSpec();
    const ch = c.chart || {};
    const datasets =
      Array.isArray(ch.datasets) && ch.datasets.length > 0 ? ch.datasets : d0.datasets;
    const merged = JSON.parse(
      JSON.stringify({
        ...base,
        ...c,
        chart: {
          ...d0,
          ...ch,
          datasets,
        },
      }),
    );
    return merged;
  } catch {
    return base;
  }
}

function labelForSourceBlock(
  b: any,
  documentData: { pages?: { id: string; name?: string }[] },
): string {
  const page = documentData.pages?.find((p) => p.id === b.pageId);
  const pageLabel = page?.name || b.pageId || "?";
  const kind = b.type === "linkedTable" ? "Tabela linkada" : "Tabela";
  return `${kind} · ${pageLabel} · …${String(b.id).slice(-6)}`;
}

export function bindChartModal(options: {
  refs: Record<string, HTMLElement | null>;
  blocks: any[];
  documentData: any;
  state: any;
  renderer: { renderCanvas: () => void };
}) {
  const { refs, blocks, documentData, state, renderer } = options;
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

  const el = {
    dataSource: refs.chartConfigDataSource as HTMLSelectElement | null,
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
  let working: ChartBlockContent = emptyChartContent();

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

  function fillDataSourceSelect() {
    if (!el.dataSource || !editingBlock) {
      return;
    }
    el.dataSource.innerHTML = "";
    const opt0 = document.createElement("option");
    opt0.value = "";
    opt0.textContent = "— Selecionar tabela —";
    el.dataSource.append(opt0);
    const candidates = blocks.filter((b) => {
      if (b.id === editingBlock.id) {
        return false;
      }
      if (b.type !== "table" && b.type !== "linkedTable") {
        return false;
      }
      return effectiveBlockLanguageId(b, documentData) === state.activeLanguageId;
    });
    candidates.forEach((b) => {
      const o = document.createElement("option");
      o.value = b.id;
      o.textContent = labelForSourceBlock(b, documentData);
      el.dataSource!.append(o);
    });
  }

  function renderDatasetEditors() {
    if (!el.datasets) {
      return;
    }
    el.datasets.innerHTML = "";
    const base = working.chart.baseType;

    working.chart.datasets.forEach((ds, index) => {
      const wrap = document.createElement("div");
      wrap.className = "rounded-lg border border-slate-200 bg-slate-50 p-3";
      wrap.innerHTML = `
        <div class="mb-2 text-xs font-semibold uppercase text-slate-500">Serie ${index + 1}</div>
        <div class="grid gap-2 sm:grid-cols-2">
          <label class="flex flex-col gap-1 text-xs text-slate-600">
            Nome
            <input type="text" data-field="label" data-i="${index}" class="rounded border border-slate-300 px-2 py-1 text-sm" />
          </label>
          <label class="flex flex-col gap-1 text-xs text-slate-600">
            Tipo (misto)
            <select data-field="dtype" data-i="${index}" class="rounded border border-slate-300 px-2 py-1 text-sm"></select>
          </label>
          <label class="flex flex-col gap-1 text-xs text-slate-600">
            Coluna X (indice 0…)
            <input type="number" min="0" data-field="x" data-i="${index}" class="rounded border border-slate-300 px-2 py-1 text-sm font-mono" />
          </label>
          <label class="flex flex-col gap-1 text-xs text-slate-600">
            Coluna Y (indice)
            <input type="number" min="0" data-field="y" data-i="${index}" class="rounded border border-slate-300 px-2 py-1 text-sm font-mono" />
          </label>
        </div>
        <div class="ohlc-grid mt-2 grid gap-2 sm:grid-cols-4" data-ohlc="${index}" style="display:${base === "candlestick" ? "grid" : "none"}">
          <label class="flex flex-col gap-1 text-xs text-slate-600">Open<input type="number" min="0" data-field="o" data-i="${index}" class="rounded border px-2 py-1 font-mono text-sm" /></label>
          <label class="flex flex-col gap-1 text-xs text-slate-600">High<input type="number" min="0" data-field="h" data-i="${index}" class="rounded border px-2 py-1 font-mono text-sm" /></label>
          <label class="flex flex-col gap-1 text-xs text-slate-600">Low<input type="number" min="0" data-field="l" data-i="${index}" class="rounded border px-2 py-1 font-mono text-sm" /></label>
          <label class="flex flex-col gap-1 text-xs text-slate-600">Close<input type="number" min="0" data-field="c" data-i="${index}" class="rounded border px-2 py-1 font-mono text-sm" /></label>
        </div>
        <div class="bubble-r mt-2" data-bubble="${index}" style="display:${base === "bubble" ? "block" : "none"}">
          <label class="flex flex-col gap-1 text-xs text-slate-600">Coluna R (raio)
            <input type="number" min="0" data-field="r" data-i="${index}" class="rounded border px-2 py-1 font-mono text-sm" />
          </label>
        </div>
        <label class="mt-2 flex flex-col gap-1 text-xs text-slate-600">
          Cor da linha / borda
          <select data-field="color" data-i="${index}" class="rounded border border-slate-300 px-2 py-1 text-sm"></select>
        </label>
        <label class="mt-2 flex items-center gap-2 text-xs text-slate-600">
          <input type="checkbox" data-field="fill" data-i="${index}" />
          Preencher area (linha)
        </label>
      `;
      el.datasets.append(wrap);

      (wrap.querySelector(`[data-field="label"]`) as HTMLInputElement).value = ds.label;
      (wrap.querySelector(`[data-field="x"]`) as HTMLInputElement).value = String(ds.mapping.xColumnIndex);
      (wrap.querySelector(`[data-field="y"]`) as HTMLInputElement).value = String(ds.mapping.yColumnIndex);
      if (ds.mapping.openColumnIndex !== undefined) {
        (wrap.querySelector(`[data-field="o"]`) as HTMLInputElement).value = String(ds.mapping.openColumnIndex);
      }
      if (ds.mapping.highColumnIndex !== undefined) {
        (wrap.querySelector(`[data-field="h"]`) as HTMLInputElement).value = String(ds.mapping.highColumnIndex);
      }
      if (ds.mapping.lowColumnIndex !== undefined) {
        (wrap.querySelector(`[data-field="l"]`) as HTMLInputElement).value = String(ds.mapping.lowColumnIndex);
      }
      if (ds.mapping.closeColumnIndex !== undefined) {
        (wrap.querySelector(`[data-field="c"]`) as HTMLInputElement).value = String(ds.mapping.closeColumnIndex);
      }
      if (ds.mapping.rColumnIndex !== undefined) {
        (wrap.querySelector(`[data-field="r"]`) as HTMLInputElement).value = String(ds.mapping.rColumnIndex);
      }
      (wrap.querySelector(`[data-field="fill"]`) as HTMLInputElement).checked = Boolean(ds.style?.fill);

      const dtype = wrap.querySelector(`[data-field="dtype"]`) as HTMLSelectElement;
      DATASET_TYPE_OPTIONS.forEach((opt) => {
        const o = document.createElement("option");
        o.value = opt.value;
        o.textContent = opt.label;
        dtype.append(o);
      });
      dtype.value = ds.type || "";

      const colorSel = wrap.querySelector(`[data-field="color"]`) as HTMLSelectElement;
      CHART_PALETTE_HEX.forEach((hex, ci) => {
        const o = document.createElement("option");
        o.value = hex;
        o.textContent = `${ci + 1} · ${hex}`;
        colorSel.append(o);
      });
      const current = ds.style?.borderColor || CHART_PALETTE_HEX[index % CHART_PALETTE_HEX.length];
      colorSel.value = CHART_PALETTE_HEX.includes(current) ? current : CHART_PALETTE_HEX[0];

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "mt-2 text-xs text-red-600 underline";
      removeBtn.textContent = "Remover serie";
      removeBtn.addEventListener("click", () => {
        working.chart.datasets.splice(index, 1);
        if (working.chart.datasets.length === 0) {
          working.chart.datasets = defaultChartSpec().datasets;
        }
        renderDatasetEditors();
      });
      wrap.append(removeBtn);
    });
  }

  function readWorkingFromForm(): ChartBlockContent {
    const chart = working.chart;
    chart.baseType = (el.baseType?.value || "line") as ChartBaseType;
    chart.title = {
      text: el.chartTitle?.value || "",
      backgroundColor: "",
      color: "#0f172a",
    };
    chart.legendDisplay = el.legend?.checked !== false;
    chart.yAxisRight = el.yRight?.checked === true;

    const rowEls = el.datasets ? Array.from(el.datasets.children) : [];
    chart.datasets = rowEls.map((row, index) => {
      const label = (row.querySelector(`[data-field="label"]`) as HTMLInputElement)?.value || `Serie ${index + 1}`;
      const dtypeRaw = (row.querySelector(`[data-field="dtype"]`) as HTMLSelectElement)?.value || "";
      const x = Number((row.querySelector(`[data-field="x"]`) as HTMLInputElement)?.value) || 0;
      const y = Number((row.querySelector(`[data-field="y"]`) as HTMLInputElement)?.value) || 0;
      const o = Number((row.querySelector(`[data-field="o"]`) as HTMLInputElement)?.value);
      const h = Number((row.querySelector(`[data-field="h"]`) as HTMLInputElement)?.value);
      const l = Number((row.querySelector(`[data-field="l"]`) as HTMLInputElement)?.value);
      const closeCol = Number((row.querySelector(`[data-field="c"]`) as HTMLInputElement)?.value);
      const r = Number((row.querySelector(`[data-field="r"]`) as HTMLInputElement)?.value);
      const color =
        (row.querySelector(`[data-field="color"]`) as HTMLSelectElement)?.value || CHART_PALETTE_HEX[0];
      const fill = (row.querySelector(`[data-field="fill"]`) as HTMLInputElement)?.checked || false;

      const mapping: ChartDatasetSpec["mapping"] = {
        xColumnIndex: x,
        yColumnIndex: y,
      };
      if (chart.baseType === "candlestick") {
        mapping.openColumnIndex = Number.isFinite(o) ? o : 0;
        mapping.highColumnIndex = Number.isFinite(h) ? h : 1;
        mapping.lowColumnIndex = Number.isFinite(l) ? l : 2;
        mapping.closeColumnIndex = Number.isFinite(closeCol) ? closeCol : 3;
      }
      if (chart.baseType === "bubble" && Number.isFinite(r)) {
        mapping.rColumnIndex = r;
      }

      const prev = working.chart.datasets[index];
      return {
        id: prev?.id || createId("cds"),
        label,
        type: dtypeRaw ? (dtypeRaw as ChartDatasetSpec["type"]) : undefined,
        mapping,
        style: {
          borderColor: color,
          backgroundColor: `${color}33`,
          fill,
          tension: 0.25,
        },
      };
    });

    return {
      ...working,
      dataSourceBlockId: el.dataSource?.value || null,
      firstRowIsHeader: el.firstRow?.checked !== false,
      chart,
    };
  }

  function syncFormFromWorking() {
    if (el.dataSource) {
      el.dataSource.value = working.dataSourceBlockId || "";
    }
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
    renderDatasetEditors();
  }

  el.baseType?.addEventListener("change", () => {
    working.chart.baseType = (el.baseType!.value || "line") as ChartBaseType;
    renderDatasetEditors();
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
        borderColor: CHART_PALETTE_HEX[working.chart.datasets.length % CHART_PALETTE_HEX.length],
        fill: false,
        tension: 0.25,
      },
    });
    renderDatasetEditors();
  });

  modalController = {
    open(block: any) {
      editingBlock = block;
      working = cloneChartContent(block.content);
      fillDataSourceSelect();
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
    const next = readWorkingFromForm();
    const resolved = resolveChartTableData(blocks, next);
    if (!resolved.ok) {
      if (el.error) {
        el.error.textContent = resolved.message;
      }
      window.alert(resolved.message);
      return;
    }
    const v = validateChartConfiguration(next, resolved.data);
    if (!v.ok) {
      if (el.error) {
        el.error.textContent = v.message;
      }
      window.alert(v.message);
      return;
    }
    if (el.error) {
      el.error.textContent = "";
    }
    editingBlock.content = {
      ...next,
      configured: true,
    };
    hide();
    renderer.renderCanvas();
  });
}
