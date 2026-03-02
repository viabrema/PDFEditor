import { createTableElement } from "./tableBlock.js";

export function createBlockElement(block) {
  const element = document.createElement("div");
  element.className =
    "block-shell absolute rounded-md border border-slate-200 bg-white shadow-sm";
  element.dataset.blockId = block.id;
  element.style.left = `${block.position.x}px`;
  element.style.top = `${block.position.y}px`;
  element.style.width = `${block.size.width}px`;
  element.style.height = `${block.size.height}px`;

  let editorHost = null;

  if (block.type === "image") {
    const img = document.createElement("img");
    img.className = "image-block";
    img.alt = "Imagem";
    img.src = block.content?.src || "";
    element.append(img);
  } else if (block.type === "table") {
    const table = createTableElement(block);
    element.append(table);
  } else {
    editorHost = document.createElement("div");
    editorHost.className = "prose-editor h-full w-full p-3";
    element.append(editorHost);
  }

  ["nw", "ne", "se", "sw"].forEach((corner) => {
    const handle = document.createElement("span");
    handle.className = "resize-handle";
    handle.dataset.corner = corner;
    element.append(handle);
  });

  return { element, editorHost };
}
