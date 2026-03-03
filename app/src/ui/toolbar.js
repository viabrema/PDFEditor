export function createToolbar(commands, options = {}) {
  const { disabled = false } = options;
  const container = document.createElement("div");
  container.className = "flex flex-wrap gap-2";

  const fontFamilies = [
    "Segoe UI",
    "Times New Roman",
    "Georgia",
    "Arial",
    "Courier New",
  ];
  const fontSizes = ["12px", "14px", "16px", "18px", "20px", "24px", "28px"];

  const fontSelect = document.createElement("select");
  fontSelect.className =
    "rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700";
  fontSelect.title = "Fonte";
  fontSelect.setAttribute("aria-label", "Fonte");
  fontSelect.innerHTML = fontFamilies
    .map((font) => `<option value="${font}">${font}</option>`)
    .join("");
  fontSelect.addEventListener("change", () => {
    commands?.setFontFamily?.(fontSelect.value);
  });

  const sizeSelect = document.createElement("select");
  sizeSelect.className =
    "rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700";
  sizeSelect.title = "Tamanho da fonte";
  sizeSelect.setAttribute("aria-label", "Tamanho da fonte");
  sizeSelect.innerHTML = fontSizes
    .map((size) => `<option value="${size}">${size}</option>`)
    .join("");
  sizeSelect.value = "14px";
  sizeSelect.addEventListener("change", () => {
    commands?.setFontSize?.(sizeSelect.value);
  });

  if (disabled) {
    fontSelect.disabled = true;
    sizeSelect.disabled = true;
  }

  container.append(fontSelect, sizeSelect);

  const items = [
    { id: "bold", label: "Negrito", icon: "bold", action: commands?.toggleBold },
    { id: "italic", label: "Italico", icon: "italic", action: commands?.toggleItalic },
    { id: "bullet", label: "Lista", icon: "list", action: commands?.toggleBulletList },
    {
      id: "ordered",
      label: "Numerada",
      icon: "list-ordered",
      action: commands?.toggleOrderedList,
    },
  ];

  items.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.action = item.id;
    button.className =
      "toolbar-icon-button rounded-md border border-slate-300 bg-white text-slate-700 shadow-sm hover:border-slate-400";
    button.title = item.label;
    button.setAttribute("aria-label", item.label);
    if (disabled) {
      button.disabled = true;
      button.classList.add("opacity-40", "cursor-not-allowed");
    }
    button.innerHTML = `<i data-lucide="${item.icon}"></i>`;
    button.addEventListener("click", () => item.action && item.action());
    container.append(button);
  });

  return container;
}
