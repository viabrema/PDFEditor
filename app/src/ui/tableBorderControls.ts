import type { TableBorderPreset } from "../blocks/tableBorderPresets";
import { labeledField } from "./contextToolbarLayout";

type BorderControlOptions = {
  borderColor?: string;
  onBorderColorChange?: (color: string) => void;
  onApplyPreset: (preset: TableBorderPreset) => void;
};

type PresetDef = { id: TableBorderPreset; label: string; markup: string };

const SVG = {
  frame: `<svg class="table-border-preset-icon" viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="3" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>`,
  top: `<svg class="table-border-preset-icon" viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="3" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1"/><path d="M3 3h10" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"/></svg>`,
  bottom: `<svg class="table-border-preset-icon" viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="3" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1"/><path d="M3 13h10" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"/></svg>`,
  left: `<svg class="table-border-preset-icon" viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="3" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1"/><path d="M3 3v10" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"/></svg>`,
  right: `<svg class="table-border-preset-icon" viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="3" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1"/><path d="M13 3v10" stroke="currentColor" stroke-width="2.4" stroke-linecap="square"/></svg>`,
  all: `<svg class="table-border-preset-icon" viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="3" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.2"/></svg>`,
};

const PRESETS: PresetDef[] = [
  { id: "none", label: "Sem borda de impressao", markup: `<i data-lucide="ban"></i>` },
  { id: "outside", label: "Contorno externo", markup: `<i data-lucide="square"></i>` },
  { id: "all", label: "Todas as bordas", markup: SVG.all },
  { id: "top", label: "Borda superior", markup: SVG.top },
  { id: "bottom", label: "Borda inferior", markup: SVG.bottom },
  { id: "left", label: "Borda esquerda", markup: SVG.left },
  { id: "right", label: "Borda direita", markup: SVG.right },
];

function borderPresetButton(preset: PresetDef, onApplyPreset: (preset: TableBorderPreset) => void) {
  const button = document.createElement("button");
  button.type = "button";
  button.className =
    "table-border-preset-btn toolbar-icon-button shrink-0 rounded-md border border-slate-300 bg-white text-slate-700 shadow-sm hover:border-slate-400";
  button.title = preset.label;
  button.setAttribute("aria-label", preset.label);
  button.dataset.borderPreset = preset.id;
  button.innerHTML = preset.markup;
  button.addEventListener("click", () => onApplyPreset(preset.id));
  return button;
}

export function createTableBorderControls(options: BorderControlOptions) {
  const wrap = document.createElement("div");
  wrap.className = "table-border-controls flex w-full flex-col gap-2";

  const grid = document.createElement("div");
  grid.className = "table-border-preset-grid";
  PRESETS.forEach((preset) => {
    grid.append(borderPresetButton(preset, options.onApplyPreset));
  });
  wrap.append(grid);

  if (options.onBorderColorChange) {
    const color = document.createElement("input");
    color.type = "color";
    color.className = "h-9 w-full cursor-pointer rounded border border-slate-300 bg-white p-0.5";
    color.value = options.borderColor || "#0f172a";
    color.addEventListener("input", () => options.onBorderColorChange?.(color.value));
    wrap.append(labeledField("Cor da borda", color));
  }

  return wrap;
}
