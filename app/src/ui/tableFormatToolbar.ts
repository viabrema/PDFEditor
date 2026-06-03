import type { ExcelTableCellStyle, TableNumberFormatKind } from "../services/excelTableStyle";
import type { TableFormatScope } from "../blocks/tableFormatting";
import { resolveTableCellStyle } from "../blocks/tableFormatting";
import {
  compactIconButton,
  createContextToolbarActionsRow,
  createContextToolbarFieldsPanel,
  createContextToolbarRoot,
  labeledField,
  toolbarSeparator,
} from "./contextToolbarLayout";
import { appendHiddenDataToggleButton } from "./hiddenDataToggle";

export function createTableFormatToolbar(options: {
  block: { content?: any };
  getFocus: () => { row: number; col: number };
  getScope: () => TableFormatScope;
  onApply: (patch: Partial<ExcelTableCellStyle>, scope: TableFormatScope) => void;
  getMergeState?: () => { canMerge: boolean; canUnmerge: boolean };
  onMerge?: () => void;
  onUnmerge?: () => void;
  hiddenValue?: boolean;
  onToggleHidden?: (hidden: boolean) => void;
  linkedActionButtons?: HTMLElement[];
  linkedFields?: HTMLElement[];
  layout?: "inline" | "sidebar";
}) {
  const root = createContextToolbarRoot();
  const actions = createContextToolbarActionsRow();
  const fields = createContextToolbarFieldsPanel();

  function scope(): TableFormatScope {
    return options.getScope();
  }

  function currentStyle(): ExcelTableCellStyle | undefined {
    const { row, col } = options.getFocus();
    return resolveTableCellStyle(options.block.content || {}, row, col);
  }

  actions.append(
    compactIconButton("bold", "Negrito", () => {
      const st = currentStyle();
      const next = st?.fontWeight === "bold" ? "normal" : "bold";
      options.onApply({ fontWeight: next }, scope());
    }),
    compactIconButton("italic", "Italico", () => {
      const st = currentStyle();
      const next = st?.fontStyle === "italic" ? "normal" : "italic";
      options.onApply({ fontStyle: next }, scope());
    }),
    compactIconButton("align-left", "Alinhar esquerda", () => options.onApply({ textAlign: "left" }, scope())),
    compactIconButton("align-center", "Alinhar centro", () =>
      options.onApply({ textAlign: "center" }, scope()),
    ),
    compactIconButton("align-right", "Alinhar direita", () => options.onApply({ textAlign: "right" }, scope())),
    compactIconButton("align-vertical-justify-center", "Centralizar verticalmente", () => {
      const st = currentStyle();
      const next = st?.verticalAlign === "middle" ? "top" : "middle";
      options.onApply({ verticalAlign: next }, scope());
    }),
  );

  if (options.getMergeState && options.onMerge && options.onUnmerge) {
    const mergeBtn = compactIconButton("table-cells-merge", "Mesclar celulas", () => options.onMerge!());
    const unmergeBtn = compactIconButton("table-cells-split", "Desmesclar celulas", () => options.onUnmerge!());
    const refreshMergeButtons = () => {
      const st = options.getMergeState!();
      mergeBtn.disabled = !st.canMerge;
      unmergeBtn.disabled = !st.canUnmerge;
    };
    refreshMergeButtons();
    mergeBtn.addEventListener("click", refreshMergeButtons);
    unmergeBtn.addEventListener("click", refreshMergeButtons);
    actions.append(toolbarSeparator(), mergeBtn, unmergeBtn);
  }

  if (options.linkedActionButtons?.length) {
    actions.append(toolbarSeparator());
    options.linkedActionButtons.forEach((btn) => actions.append(btn));
  }

  if (options.onToggleHidden) {
    actions.append(toolbarSeparator());
    appendHiddenDataToggleButton(actions, {
      hiddenValue: options.hiddenValue,
      onToggleHidden: options.onToggleHidden,
    });
  }

  const textColor = document.createElement("input");
  textColor.type = "color";
  textColor.className = "h-9 w-full cursor-pointer rounded border border-slate-300 bg-white p-0.5";
  textColor.value = currentStyle()?.color || "#0f172a";
  textColor.addEventListener("input", () => options.onApply({ color: textColor.value }, scope()));

  const bgColor = document.createElement("input");
  bgColor.type = "color";
  bgColor.className = "h-9 w-full cursor-pointer rounded border border-slate-300 bg-white p-0.5";
  bgColor.value = currentStyle()?.backgroundColor || "#ffffff";
  bgColor.addEventListener("input", () => options.onApply({ backgroundColor: bgColor.value }, scope()));

  const numKind = document.createElement("select");
  numKind.innerHTML = `
    <option value="general">Geral</option>
    <option value="number">Numero</option>
    <option value="currency">Moeda</option>
    <option value="percent">Percentagem</option>
  `;
  const nf = currentStyle()?.numberFormat;
  numKind.value = nf?.kind || "general";

  const decimals = document.createElement("input");
  decimals.type = "number";
  decimals.min = "0";
  decimals.max = "10";
  decimals.value = String(nf?.decimals ?? 2);

  const locale = document.createElement("select");
  locale.innerHTML = `
    <option value="pt-BR">pt-BR</option>
    <option value="en-US">en-US</option>
    <option value="es-ES">es-ES</option>
  `;
  locale.value = nf?.locale || "pt-BR";

  function applyNumberFormat() {
    const kind = numKind.value as TableNumberFormatKind;
    options.onApply(
      {
        numberFormat: {
          kind,
          decimals: Number(decimals.value) || 0,
          locale: locale.value,
        },
      },
      scope(),
    );
  }

  numKind.addEventListener("change", applyNumberFormat);
  decimals.addEventListener("change", applyNumberFormat);
  locale.addEventListener("change", applyNumberFormat);

  if (options.linkedFields?.length) {
    options.linkedFields.forEach((el) => fields.append(el));
  }

  fields.append(
    labeledField("Cor do texto", textColor),
    labeledField("Cor de fundo", bgColor),
    labeledField("Formato numerico", numKind),
    labeledField("Casas decimais", decimals),
    labeledField("Locale", locale),
  );

  root.append(actions, fields);
  return root;
}
