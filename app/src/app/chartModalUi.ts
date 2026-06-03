import type {
  ChartBlockContent,
  ChartDatasetSpec,
  ChartBaseType,
} from "../blocks/chartBlockTypes";
import { defaultChartSpec } from "../blocks/chartBlockTypes";
import { CHART_PALETTE_HEX } from "../blocks/chartPalette";
import { createId } from "../utils/id";

const DATASET_TYPE_OPTIONS = [
  { value: "", label: "Igual ao grafico" },
  { value: "line", label: "Linha" },
  { value: "bar", label: "Barras" },
];

export function readDataGridFromDom(
  dataGridHost: HTMLElement | null,
  working: ChartBlockContent,
): string[][] {
  if (!dataGridHost) {
    return working.dataSourceRows.map((r) => [...r]);
  }
  const trs = dataGridHost.querySelectorAll("tr[data-grid-row]");
  return Array.from(trs).map((tr) =>
    Array.from(tr.querySelectorAll("input[data-grid-cell]")).map((inp) =>
      String((inp as HTMLInputElement).value ?? ""),
    ),
  );
}

export function renderDataGrid(
  dataGridHost: HTMLElement | null,
  working: ChartBlockContent,
) {
  if (!dataGridHost) {
    return;
  }
  dataGridHost.innerHTML = "";
  const rows = working.dataSourceRows;
  const colCount = Math.max(1, ...rows.map((r) => r.length));
  const table = document.createElement("table");
  table.className = "w-full border-collapse text-sm";
  rows.forEach((row, ri) => {
    const tr = document.createElement("tr");
    tr.dataset.gridRow = String(ri);
    for (let ci = 0; ci < colCount; ci += 1) {
      const td = document.createElement("td");
      td.className = "border border-slate-200 p-0";
      const inp = document.createElement("input");
      inp.type = "text";
      inp.dataset.gridCell = `${ri},${ci}`;
      inp.className = "h-8 w-full min-w-[4.5rem] border-0 bg-white px-2 py-1 outline-none focus:bg-slate-50";
      inp.value = row[ci] ?? "";
      td.append(inp);
      tr.append(td);
    }
    table.append(tr);
  });
  dataGridHost.append(table);
}

export function renderDatasetEditors(
  datasetsHost: HTMLElement | null,
  working: ChartBlockContent,
  onRemove: (index: number) => void,
) {
  if (!datasetsHost) {
    return;
  }
  datasetsHost.innerHTML = "";
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
    datasetsHost.append(wrap);

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
    removeBtn.addEventListener("click", () => onRemove(index));
    wrap.append(removeBtn);
  });
}

export function readWorkingFromForm(
  working: ChartBlockContent,
  el: {
    firstRow: HTMLInputElement | null;
    baseType: HTMLSelectElement | null;
    chartTitle: HTMLInputElement | null;
    legend: HTMLInputElement | null;
    yRight: HTMLInputElement | null;
    datasets: HTMLElement | null;
  },
  dataGridHost: HTMLElement | null,
): ChartBlockContent {
  working.dataSourceRows = readDataGridFromDom(dataGridHost, working);

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
    firstRowIsHeader: el.firstRow?.checked !== false,
    chart,
    dataSourceBlockId: undefined,
  };
}
