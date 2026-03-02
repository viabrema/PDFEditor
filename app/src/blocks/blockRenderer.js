export function createBlockElement(block) {
  const element = document.createElement("div");
  element.className =
    "absolute rounded-md border border-slate-200 bg-white shadow-sm";
  element.dataset.blockId = block.id;
  element.style.left = `${block.position.x}px`;
  element.style.top = `${block.position.y}px`;
  element.style.width = `${block.size.width}px`;
  element.style.height = `${block.size.height}px`;

  const editorHost = document.createElement("div");
  editorHost.className = "prose-editor h-full w-full p-3";
  element.append(editorHost);

  return { element, editorHost };
}
