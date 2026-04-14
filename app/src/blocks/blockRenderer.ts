import { getBlockTextStyle } from "./blockStyles";
import { createTableElement, setTableEditable } from "./tableBlock";
import { chartBlockHasExcelLink, isChartConfigured } from "./chartBlock";

export function createBlockElement(block, { selected = false, editing = false } = {}) {
  const element = document.createElement("div");
  element.className =
    "block-shell absolute rounded-md border border-slate-200 bg-white shadow-sm";
  if (block.type === "heading" || block.type === "title" || block.type === "subtitle") {
    element.classList.add("heading-block");
  }
  if (block.type === "text") {
    element.classList.add("text-block");
  }
  if (selected) {
    element.classList.add("is-selected");
  }
  if (block.metadata?.hidden === true) {
    element.classList.add("is-hidden-data");
  }
  if (editing) {
    element.classList.add("is-editing");
  }
  element.dataset.blockId = block.id;
  element.style.left = `${block.position.x}px`;
  element.style.top = `${block.position.y}px`;
  element.style.width = `${block.size.width}px`;
  element.style.height = `${block.size.height}px`;

  let editorHost: HTMLDivElement | null = null;

  if (block.type === "image") {
    const img = document.createElement("img");
    img.className = "image-block";
    img.alt = "Imagem";
    img.src = block.content?.src || "";
    element.append(img);
  } else if (block.type === "table") {
    const host = document.createElement("div");
    host.className = "table-block-host h-full w-full";
    const table = createTableElement(block);
    setTableEditable(table, editing);
    host.append(table);
    element.append(host);
  } else if (block.type === "linkedTable") {
    element.classList.add("linked-table-shell");
    const host = document.createElement("div");
    host.className = "table-block-host h-full w-full";
    const table = createTableElement(block, { readOnly: !editing });
    host.append(table);
    element.append(host);
  } else if (block.type === "chart") {
    element.classList.add("chart-block-shell");
    const host = document.createElement("div");
    host.className = "chart-block-host relative flex h-full min-h-[120px] w-full flex-col overflow-hidden bg-white";
    const canvasWrap = document.createElement("div");
    canvasWrap.className = "relative min-h-0 flex-1";
    const canvas = document.createElement("canvas");
    canvas.className = "chart-block-canvas block h-full w-full";
    canvas.setAttribute("aria-label", "Grafico");
    const hint = document.createElement("div");
    hint.className =
      "chart-block-hint pointer-events-none absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-slate-400";
    hint.textContent = chartBlockHasExcelLink(block)
      ? "Duplo clique para ferramentas"
      : "Duplo clique para configurar";
    if (isChartConfigured(block)) {
      canvasWrap.append(canvas);
    } else {
      canvasWrap.append(hint);
    }
    host.append(canvasWrap);
    element.append(host);
  } else {
    editorHost = document.createElement("div");
    editorHost.className = "prose-editor h-full w-full p-3";
    element.append(editorHost);
    const style = getBlockTextStyle(block);
    editorHost.style.fontSize = style.fontSize;
    editorHost.style.fontFamily = style.fontFamily;
    editorHost.style.fontWeight = style.fontWeight;
    editorHost.style.color = style.color;
    editorHost.style.textAlign = style.textAlign;
  }

  if (selected) {
    ["nw", "ne", "se", "sw"].forEach((corner) => {
      const handle = document.createElement("span");
      handle.className = "resize-handle";
      handle.dataset.corner = corner;
      element.append(handle);
    });
  }

  return { element, editorHost };
}
