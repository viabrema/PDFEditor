import type { ExcelTableCellStyle, TableNumberFormatKind } from "../services/excelTableStyle";
import type { TableFormatScope } from "../blocks/tableFormatting";
import { resolveTableCellStyle } from "../blocks/tableFormatting";

export function createTableFormatToolbar(options: {
  block: { content?: any };
  getFocus: () => { row: number; col: number };
  getScope: () => TableFormatScope;
  onApply: (patch: Partial<ExcelTableCellStyle>, scope: TableFormatScope) => void;
  hiddenValue?: boolean;
  onToggleHidden?: (hidden: boolean) => void;
  linkedExtras?: HTMLElement[];
  layout?: "inline" | "sidebar";
}) {
  const layout = options.layout || "inline";
  const container = document.createElement("div");
  container.className =
    layout === "sidebar"
      ? "flex w-full flex-col items-stretch gap-3"
      : "flex max-w-[min(92vw,720px)] flex-wrap items-center gap-2";

  function scope(): TableFormatScope {
    return options.getScope();
  }

  function currentStyle(): ExcelTableCellStyle | undefined {
    const { row, col } = options.getFocus();
    return resolveTableCellStyle(options.block.content || {}, row, col);
  }

  function btn(icon: string, title: string, onClick: () => void) {
    const b = document.createElement("button");
    b.type = "button";
    b.className =
      "toolbar-icon-button rounded-md border border-slate-300 bg-white text-slate-700 shadow-sm hover:border-slate-400";
    b.title = title;
    b.setAttribute("aria-label", title);
    b.innerHTML = `<i data-lucide="${icon}"></i>`;
    b.addEventListener("click", onClick);
    return b;
  }

  const sep = () => {
    const s = document.createElement("span");
    s.className = "mx-1 h-6 w-px bg-slate-200";
    s.setAttribute("aria-hidden", "true");
    return s;
  };

  container.append(
    btn("bold", "Negrito", () => {
      const st = currentStyle();
      const next = st?.fontWeight === "bold" ? "normal" : "bold";
      options.onApply({ fontWeight: next }, scope());
    }),
  );
  container.append(
    btn("italic", "Italico", () => {
      const st = currentStyle();
      const next = st?.fontStyle === "italic" ? "normal" : "italic";
      options.onApply({ fontStyle: next }, scope());
    }),
  );
  container.append(
    btn("align-left", "Alinhar esquerda", () => options.onApply({ textAlign: "left" }, scope())),
  );
  container.append(
    btn("align-center", "Alinhar centro", () => options.onApply({ textAlign: "center" }, scope())),
  );
  container.append(
    btn("align-right", "Alinhar direita", () => options.onApply({ textAlign: "right" }, scope())),
  );

  container.append(sep());

  const textColor = document.createElement("input");
  textColor.type = "color";
  textColor.className = "h-8 w-10 cursor-pointer rounded border border-slate-300 bg-white p-0.5";
  textColor.title = "Cor do texto";
  textColor.value = currentStyle()?.color || "#0f172a";
  textColor.addEventListener("input", () => options.onApply({ color: textColor.value }, scope()));

  const bgColor = document.createElement("input");
  bgColor.type = "color";
  bgColor.className = "h-8 w-10 cursor-pointer rounded border border-slate-300 bg-white p-0.5";
  bgColor.title = "Cor de fundo";
  bgColor.value = currentStyle()?.backgroundColor || "#ffffff";
  bgColor.addEventListener("input", () => options.onApply({ backgroundColor: bgColor.value }, scope()));

  container.append(textColor, bgColor);
  container.append(sep());

  const numKind = document.createElement("select");
  numKind.className =
    "rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700";
  numKind.title = "Formato numerico";
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
  decimals.className =
    "w-12 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700";
  decimals.title = "Casas decimais";
  decimals.value = String(nf?.decimals ?? 2);

  const locale = document.createElement("select");
  locale.className =
    "rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700";
  locale.title = "Locale";
  locale.innerHTML = `
    <option value="pt-BR">pt-BR</option>
    <option value="en-US">en-US</option>
    <option value="es-ES">es-ES</option>
  `;
  locale.value = nf?.locale || "pt-BR";

  function applyNumberFormat() {
    const kind = numKind.value as TableNumberFormatKind;
    const patch: Partial<ExcelTableCellStyle> = {
      numberFormat: {
        kind,
        decimals: Number(decimals.value) || 0,
        locale: locale.value,
      },
    };
    options.onApply(patch, scope());
  }

  numKind.addEventListener("change", applyNumberFormat);
  decimals.addEventListener("change", applyNumberFormat);
  locale.addEventListener("change", applyNumberFormat);

  container.append(numKind, decimals, locale);

  if (options.linkedExtras?.length) {
    container.append(sep());
    options.linkedExtras.forEach((el) => container.append(el));
  }

  if (options.onToggleHidden) {
    container.append(sep());
    const hiddenBtn = document.createElement("button");
    hiddenBtn.type = "button";
    hiddenBtn.dataset.action = "toggle-hidden";
    hiddenBtn.className = options.hiddenValue
      ? "toolbar-icon-button rounded-md bg-slate-900 text-white shadow-sm"
      : "toolbar-icon-button rounded-md border border-slate-300 bg-white text-slate-700 shadow-sm";
    hiddenBtn.title = options.hiddenValue ? "Desmarcar dado oculto" : "Marcar como dado oculto";
    hiddenBtn.innerHTML = `<i data-lucide="database"></i>`;
    hiddenBtn.addEventListener("click", () => options.onToggleHidden?.(!options.hiddenValue));
    container.append(hiddenBtn);
  }

  return container;
}
