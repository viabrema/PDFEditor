import {
  compactIconButton,
  createContextToolbarActionsRow,
  createContextToolbarFieldsPanel,
  createContextToolbarRoot,
  labeledField,
  toolbarSeparator,
} from "./contextToolbarLayout";
import { appendHiddenDataToggleButton } from "./hiddenDataToggle";

export function createToolbar(commands: any, options: any = {}) {
  const {
    disabled = false,
    layout = "inline",
    variant = "text",
    hiddenValue = false,
    onAlignChange,
    onFontFamilyChange,
    onFontSizeChange,
    onHeadingLevelChange,
    onFontScaleChange,
    onLinkedTableExcelConfigure,
    onLinkedTableDataSource,
    onLinkedChartExcelConfigure,
    onLinkedChartDesignConfigure,
    onToggleHidden,
    alignValue = "left",
    fontFamilyValue = "Segoe UI",
    fontSizeValue = "16px",
    headingLevelValue = 1,
    fontScaleValue = 1,
  } = options;
  const container = document.createElement("div");
  container.className =
    layout === "sidebar"
      ? "flex w-full flex-col items-stretch gap-3"
      : "flex flex-wrap items-center gap-2";

  function appendHiddenToggleButton(parent: HTMLElement = container) {
    appendHiddenDataToggleButton(parent, {
      hiddenValue,
      disabled,
      onToggleHidden,
    });
  }

  if (variant === "table") {
    appendHiddenToggleButton();
    return container;
  }

  if (variant === "linkedTable" || variant === "linkedChart") {
    const root = layout === "sidebar" ? createContextToolbarRoot() : container;
    const actions = createContextToolbarActionsRow();
    const fields = createContextToolbarFieldsPanel();

    if (variant === "linkedTable" && onLinkedTableDataSource) {
      actions.append(compactIconButton("database", "Fonte de dados", () => onLinkedTableDataSource()));
    }

    const onExcel =
      variant === "linkedTable" ? onLinkedTableExcelConfigure : onLinkedChartExcelConfigure;
    if (onExcel) {
      actions.append(
        compactIconButton("file-spreadsheet", "Alterar ficheiro, folha ou intervalo Excel", () =>
          onExcel(),
        ),
      );
    }

    if (variant === "linkedChart" && onLinkedChartDesignConfigure) {
      actions.append(
        compactIconButton("sliders-horizontal", "Configurar tipo de grafico e series", () =>
          onLinkedChartDesignConfigure(),
        ),
      );
    }

    if (onToggleHidden) {
      if (actions.childElementCount > 0) {
        actions.append(toolbarSeparator());
      }
      appendHiddenToggleButton(actions);
    }

    const range = document.createElement("input");
    range.type = "range";
    range.min = "0.5";
    range.max = "2";
    range.step = "0.05";
    range.value = String(fontScaleValue);
    range.className = "h-2 w-full accent-slate-700";

    const valueEl = document.createElement("span");
    valueEl.className = "text-xs tabular-nums text-slate-500";
    valueEl.textContent = Number(fontScaleValue).toFixed(2);

    range.addEventListener("input", () => {
      const v = Number(range.value);
      valueEl.textContent = v.toFixed(2);
      onFontScaleChange?.(v);
    });

    const scaleField = labeledField("Escala da fonte", range);
    scaleField.append(valueEl);
    fields.append(scaleField);

    root.append(actions, fields);
    return root;
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
      layout === "sidebar"
        ? "w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700"
        : "rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700";
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

  let levelSelect: HTMLSelectElement | undefined;
  if (variant === "heading") {
    levelSelect = createSelect({
      title: "Nivel do titulo",
      value: String(headingLevelValue),
      options: headingLevels.map((level) => ({
        value: String(level.value),
        label: level.label,
      })),
      onChange: (value) => onHeadingLevelChange?.(Number(value)),
    });
  }

  let sizeSelect: HTMLSelectElement | undefined;
  if (variant === "text") {
    sizeSelect = createSelect({
      title: "Tamanho da fonte",
      value: fontSizeValue,
      options: fontSizes.map((size) => ({ value: size, label: size })),
      onChange: (value) => onFontSizeChange?.(value),
    });
  }

  const fontSelect = createSelect({
    title: "Fonte",
    value: fontFamilyValue,
    options: fontFamilies.map((font) => ({ value: font, label: font })),
    onChange: (value) => onFontFamilyChange?.(value),
  });

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

  const appendFormatButtons = (parent: HTMLElement) => {
    items.forEach((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.action = item.id;
      button.className =
        "toolbar-icon-button shrink-0 rounded-md border border-slate-300 bg-white text-slate-700 shadow-sm hover:border-slate-400";
      button.title = item.label;
      button.setAttribute("aria-label", item.label);
      if (disabled) {
        button.disabled = true;
        button.classList.add("opacity-40", "cursor-not-allowed");
      }
      button.innerHTML = `<i data-lucide="${item.icon}"></i>`;
      button.addEventListener("click", () => item.action && item.action());
      parent.append(button);
    });
    appendHiddenToggleButton(parent);
  };

  if (layout === "sidebar") {
    const root = createContextToolbarRoot();
    const fields = createContextToolbarFieldsPanel();
    const actions = createContextToolbarActionsRow();
    if (levelSelect) {
      fields.append(labeledField("Nivel do titulo", levelSelect));
    }
    if (sizeSelect) {
      fields.append(labeledField("Tamanho da fonte", sizeSelect));
    }
    fields.append(labeledField("Fonte", fontSelect));
    appendFormatButtons(actions);
    root.append(fields, actions);
    return root;
  }

  if (levelSelect) {
    container.append(levelSelect);
  }
  if (sizeSelect) {
    container.append(sizeSelect);
  }
  container.append(fontSelect);
  appendFormatButtons(container);

  return container;
}
