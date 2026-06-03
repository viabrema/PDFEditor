import { hydrateLucideIcons } from "../ui/hydrateLucideIcons";
import { getDefaultLanguageId } from "./translationFlow";
import { renderCanvasView } from "./renderCanvas";
import { renderPropertiesSidebar } from "./renderPropertiesSidebar";
import { renderAiPanel as renderAiPanelView } from "./renderAiPanel";
import { syncStatusBar } from "./canvasZoom";
import { setLastAction } from "./activityLog";
import { destroyAllBlockCharts } from "../blocks/chartRuntime";
import {
  applyTableDomMode,
  normalizeTypingCellContent,
  resolveTableDomMode,
} from "../blocks/tableBlock";
import type { DocumentHistory } from "./documentHistory";

export function createRenderer({
  documentData,
  state,
  blocks,
  refs,
  translateFromDefaultLanguage,
  aiFlow,
  linkedTableBridge,
  linkedChartBridge,
  documentHistory,
}: {
  documentData: any;
  state: any;
  blocks: any[];
  refs: any;
  translateFromDefaultLanguage: (id: string) => void;
  aiFlow: any;
  linkedTableBridge?: { reconfigure?: (block: any) => Promise<void> };
  linkedChartBridge?: { reconfigure?: (block: any) => Promise<void> };
  documentHistory?: DocumentHistory;
}) {
  function clearViews() {
    state.views.forEach((view) => view.destroy());
    state.views = [];
  }

  function clearInteractions() {
    state.interactions.forEach((interaction) => interaction.destroy());
    state.interactions = [];
  }

  function createTabButton({ label, isActive, onClick }) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = isActive
      ? "rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white"
      : "rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600";
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  function renderTabs(container, items, activeId, onSelect) {
    container.innerHTML = "";
    items.forEach((item) => {
      container.append(
        createTabButton({
          label: item.label,
          isActive: item.id === activeId,
          onClick: () => onSelect(item.id),
        })
      );
    });
  }

  function focusEditingBlock() {
    if (!state.editingBlockId) {
      return;
    }

    const element = document.querySelector(
      `.block-shell[data-block-id="${state.editingBlockId}"]`
    );
    if (!element) {
      return;
    }

    const prose = element.querySelector(".ProseMirror");
    if (prose) {
      (prose as HTMLElement).focus();
      return;
    }

    const typingCell = element.querySelector("td.is-typing-cell") as HTMLTableCellElement | null;
    if (typingCell) {
      typingCell.focus();
      normalizeTypingCellContent(typingCell);
      return;
    }
  }

  function refreshTableChrome() {
    const edit =
      state.editingBlockId && state.tableEdit?.blockId === state.editingBlockId
        ? state.tableEdit
        : null;
    const blockId = edit?.blockId ?? state.tableEdit?.blockId;
    if (!blockId) {
      return;
    }
    const shell = document.querySelector(
      `.block-shell[data-block-id="${blockId}"]`,
    );
    const table = shell?.querySelector("table.table-block") as HTMLTableElement | undefined;
    if (table) {
      const mode = resolveTableDomMode(blockId, state.editingBlockId, edit);
      applyTableDomMode(table, mode, edit);
    }
    if (!edit) {
      renderPropertiesSidebar({
        refs,
        state,
        blocks,
        documentData,
        documentHistory,
        requestRender: render,
        linkedTableBridge,
        linkedChartBridge,
      });
      return;
    }
    renderPropertiesSidebar({
      refs,
      state,
      blocks,
      documentData,
      documentHistory,
      requestRender: render,
      linkedTableBridge,
      linkedChartBridge,
    });
    if (edit.typing) {
      const cell = shell?.querySelector("td.is-typing-cell");
      (cell as HTMLElement | undefined)?.focus();
    }
  }

  function renderCanvas() {
    destroyAllBlockCharts();
    refs.canvas.innerHTML = "";
    clearViews();
    clearInteractions();

    renderCanvasView({
      documentData,
      state,
      blocks,
      refs,
      requestRender: render,
      refreshTableChrome,
      linkedTableBridge,
      linkedChartBridge,
      documentHistory,
    });
    syncStatusBar(refs, state);
  }

  function renderMeta() {
    const pageIndex = documentData.pages.findIndex(
      (page) => page.id === state.activePageId
    );
    refs.pageMeta.textContent =
      `Pagina ${pageIndex + 1} de ${documentData.pages.length} ` +
      `(${documentData.page.format}, ${documentData.page.orientation}) ` +
      `Grid ${documentData.grid.size}px ${documentData.grid.snap ? "On" : "Off"}`;
  }

  function renderLanguageActions() {
    refs.languageActionsHost.innerHTML = "";
    refs.translationStatus.textContent = "";

    const defaultLanguageId = getDefaultLanguageId(documentData);
    if (!state.activeLanguageId || state.activeLanguageId === defaultLanguageId) {
      return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className =
      "inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-2 py-1 text-slate-700";
    button.title = "Atualizar traducao";
    button.setAttribute("aria-label", "Atualizar traducao");
    button.innerHTML = '<i data-lucide="languages"></i>';
    button.disabled = state.translation.loading;
    button.addEventListener("click", () => {
      if (!state.translation.loading) {
        documentHistory?.checkpointBeforeChange();
        translateFromDefaultLanguage(state.activeLanguageId);
      }
    });
    refs.languageActionsHost.append(button);

    if (state.translation.loading) {
      refs.translationStatus.textContent = "Traduzindo...";
      return;
    }

    if (state.translation.error) {
      refs.translationStatus.textContent = state.translation.error;
    }
  }

  function renderAiPanel() {
    renderAiPanelView({ refs, state, documentData, aiFlow, requestRender: render });
  }

  function render() {
    state.ui = state.ui || { zoomPercent: 100, lastAction: "", showHiddenBlocks: false };

    if (refs.removePageButton) {
      const onlyOne = documentData.pages.length <= 1;
      (refs.removePageButton as HTMLButtonElement).disabled = onlyOne;
      refs.removePageButton.title = onlyOne
        ? "Nao e possivel apagar a unica pagina"
        : "Apagar pagina ativa";
    }

    refs.formatSelect.value = documentData.page.format;
    refs.orientationSelect.value = documentData.page.orientation;
    refs.gridSizeInput.value = documentData.grid.size;
    refs.snapToggle.checked = documentData.grid.snap;
    refs.headerToggle.checked = documentData.regions?.header?.enabled ?? true;
    refs.footerToggle.checked = documentData.regions?.footer?.enabled ?? true;
    if (refs.toggleHiddenDataButton) {
      refs.toggleHiddenDataButton.className = state.ui.showHiddenBlocks
        ? "icon-button rounded-md bg-slate-900 text-white"
        : "icon-button rounded-md border border-slate-300 bg-white text-slate-700";
      refs.toggleHiddenDataButton.innerHTML = state.ui.showHiddenBlocks
        ? '<i data-lucide="eye-off"></i>'
        : '<i data-lucide="eye"></i>';
      refs.toggleHiddenDataButton.title = state.ui.showHiddenBlocks
        ? "Ocultar dados ocultos"
        : "Ver dados ocultos";
      refs.toggleHiddenDataButton.setAttribute(
        "aria-label",
        state.ui.showHiddenBlocks ? "Ocultar dados ocultos" : "Ver dados ocultos",
      );
    }

    renderTabs(
      refs.languageTabsHost,
      documentData.languages.map((language) => ({
        id: language.id,
        label: language.label,
      })),
      state.activeLanguageId,
      (id) => {
        state.activeLanguageId = id;
        state.selectedBlockIds = [];
        state.editingBlockId = null;
        state.tableEdit = null;
        const lang = documentData.languages.find((l: { id: string }) => l.id === id);
        setLastAction(state, `Idioma: ${lang?.label ?? id}.`);
        render();
      }
    );

    renderCanvas();
    renderMeta();
    renderPropertiesSidebar({
      refs,
      state,
      blocks,
      documentData,
      documentHistory,
      requestRender: render,
      linkedTableBridge,
      linkedChartBridge,
    });
    renderLanguageActions();
    renderAiPanel();
    focusEditingBlock();
    documentHistory?.syncUi(refs);
    hydrateLucideIcons();
  }

  return {
    render,
    renderCanvas,
    renderAiPanel,
  };
}
