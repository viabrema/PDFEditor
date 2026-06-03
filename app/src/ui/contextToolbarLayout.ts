import { createId } from "../utils/id";

const FIELD_CONTROL_CLASS =
  "w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700";

/** Painel contextual: acoes compactas em linha + campos com label em largura total. */
export function createContextToolbarRoot(extraClass = "") {
  const root = document.createElement("div");
  root.className = `context-toolbar flex w-full flex-col gap-3 ${extraClass}`.trim();
  return root;
}

export function createContextToolbarActionsRow() {
  const row = document.createElement("div");
  row.className = "context-toolbar__actions flex flex-wrap items-center gap-1";
  return row;
}

export function createContextToolbarFieldsPanel() {
  const panel = document.createElement("div");
  panel.className = "context-toolbar__fields flex w-full flex-col gap-2";
  return panel;
}

export function labeledField(labelText: string, control: HTMLElement) {
  const wrap = document.createElement("div");
  wrap.className = "context-toolbar__field flex w-full flex-col gap-1";

  const label = document.createElement("label");
  label.className = "text-xs font-medium text-slate-600";
  const id = createId("ctx-field");
  label.htmlFor = id;
  label.textContent = labelText;

  if (!control.className.includes("w-full")) {
    control.className = `${control.className} ${FIELD_CONTROL_CLASS}`.trim();
  }
  control.id = id;
  if (!control.getAttribute("aria-label")) {
    control.setAttribute("aria-label", labelText);
  }

  wrap.append(label, control);
  return wrap;
}

export function compactIconButton(icon: string, title: string, onClick: () => void) {
  const b = document.createElement("button");
  b.type = "button";
  b.className =
    "toolbar-icon-button shrink-0 rounded-md border border-slate-300 bg-white text-slate-700 shadow-sm hover:border-slate-400";
  b.title = title;
  b.setAttribute("aria-label", title);
  b.innerHTML = `<i data-lucide="${icon}"></i>`;
  b.addEventListener("click", onClick);
  return b;
}

export function toolbarSeparator() {
  const s = document.createElement("span");
  s.className = "mx-0.5 h-5 w-px shrink-0 bg-slate-200";
  s.setAttribute("aria-hidden", "true");
  return s;
}
