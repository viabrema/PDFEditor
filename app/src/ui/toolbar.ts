export function createToolbar(commands: any, options: any = {}) {
  const {
    disabled = false,
    variant = "text",
    onAlignChange,
    onFontFamilyChange,
    onFontSizeChange,
    onHeadingLevelChange,
    onFontScaleChange,
    onLinkedTableExcelConfigure,
    alignValue = "left",
    fontFamilyValue = "Segoe UI",
    fontSizeValue = "16px",
    headingLevelValue = 1,
    fontScaleValue = 1,
  } = options;
  const container = document.createElement("div");
  container.className = "flex flex-wrap items-center gap-2";

  if (variant === "linkedTable") {
    const label = document.createElement("span");
    label.className = "text-xs font-medium text-slate-600";
    label.textContent = "Escala";

    const range = document.createElement("input");
    range.type = "range";
    range.min = "0.5";
    range.max = "2";
    range.step = "0.05";
    range.value = String(fontScaleValue);
    range.title = "Escala da fonte (0,5 a 2)";
    range.setAttribute("aria-label", "Escala da fonte");
    range.className = "h-2 w-32 accent-slate-700";

    const valueEl = document.createElement("span");
    valueEl.className = "w-9 text-xs tabular-nums text-slate-700";
    valueEl.textContent = Number(fontScaleValue).toFixed(2);

    range.addEventListener("input", () => {
      const v = Number(range.value);
      valueEl.textContent = v.toFixed(2);
      onFontScaleChange?.(v);
    });

    container.append(label, range, valueEl);

    if (onLinkedTableExcelConfigure) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "toolbar-icon-button rounded-md border border-slate-300 bg-white text-slate-700 shadow-sm hover:border-slate-400";
      btn.title = "Alterar ficheiro ou intervalo Excel";
      btn.setAttribute("aria-label", "Alterar ficheiro ou intervalo Excel");
      btn.innerHTML = `<i data-lucide="file-spreadsheet"></i>`;
      btn.addEventListener("click", () => onLinkedTableExcelConfigure());
      container.append(btn);
    }

    return container;
  }

  const fontFamilies = [
    "Segoe UI",
    "Times New Roman",
    "Georgia",
    "Arial",
    "Courier New",
  ];
  const fontSizes = ["12px", "14px", "16px", "18px"];
  const headingLevels = [
    { value: 1, label: "H1" },
    { value: 2, label: "H2" },
    { value: 3, label: "H3" },
  ];

  const createSelect = ({ title, value, options, onChange }) => {
    const select = document.createElement("select");
    select.className =
      "rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700";
    select.title = title;
    select.setAttribute("aria-label", title);
    select.innerHTML = options
      .map((option) => `<option value="${option.value}">${option.label}</option>`)
      .join("");
    select.value = value;
    select.addEventListener("change", () => {
      onChange?.(select.value);
    });
    if (disabled) {
      select.disabled = true;
    }
    return select;
  };

  if (variant === "heading") {
    const levelSelect = createSelect({
      title: "Nivel do titulo",
      value: String(headingLevelValue),
      options: headingLevels.map((level) => ({
        value: String(level.value),
        label: level.label,
      })),
      onChange: (value) => onHeadingLevelChange?.(Number(value)),
    });
    container.append(levelSelect);
  }

  if (variant === "text") {
    const sizeSelect = createSelect({
      title: "Tamanho da fonte",
      value: fontSizeValue,
      options: fontSizes.map((size) => ({ value: size, label: size })),
      onChange: (value) => onFontSizeChange?.(value),
    });
    container.append(sizeSelect);
  }

  const fontSelect = createSelect({
    title: "Fonte",
    value: fontFamilyValue,
    options: fontFamilies.map((font) => ({ value: font, label: font })),
    onChange: (value) => onFontFamilyChange?.(value),
  });

  container.append(fontSelect);

  const items = [
    { id: "bold", label: "Negrito", icon: "bold", action: commands?.toggleBold },
    { id: "italic", label: "Italico", icon: "italic", action: commands?.toggleItalic },
    {
      id: "align-left",
      label: "Alinhar a esquerda",
      icon: "align-left",
      action: () => onAlignChange?.("left"),
    },
    {
      id: "align-center",
      label: "Alinhar ao centro",
      icon: "align-center",
      action: () => onAlignChange?.("center"),
    },
    {
      id: "align-right",
      label: "Alinhar a direita",
      icon: "align-right",
      action: () => onAlignChange?.("right"),
    },
  ];

  if (variant === "text") {
    items.push(
      { id: "bullet", label: "Lista", icon: "list", action: commands?.toggleBulletList },
      {
        id: "ordered",
        label: "Numerada",
        icon: "list-ordered",
        action: commands?.toggleOrderedList,
      }
    );
  }

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
