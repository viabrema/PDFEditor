import { createIcons, icons } from "lucide";
import { getDefaultLanguageId } from "./translationFlow.js";
import { renderCanvasView } from "./renderCanvas.js";

export function createRenderer({
  documentData,
  state,
  blocks,
  refs,
  translateFromDefaultLanguage,
  aiFlow,
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
      prose.focus();
      return;
    }

    const cell = element.querySelector("td");
    if (cell) {
      cell.focus();
    }
  }

  function renderCanvas() {
    refs.canvas.innerHTML = "";
    clearViews();
    clearInteractions();

    renderCanvasView({
      documentData,
      state,
      blocks,
      refs,
      requestRender: render,
    });
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
    const selectedBlock = aiFlow.getSelectedBlock();
    refs.aiPanel.classList.toggle("is-open", state.ai.open);
    refs.aiPanel.setAttribute("aria-hidden", state.ai.open ? "false" : "true");

    if (!selectedBlock) {
      refs.aiTarget.textContent = "Pagina ativa";
    } else {
      refs.aiTarget.textContent = `Bloco: ${selectedBlock.type}`;
    }

    refs.aiSend.disabled = state.ai.loading;
    refs.aiStatus.textContent = state.ai.loading ? "Processando..." : state.ai.error || "";
    refs.aiResponse.textContent = state.ai.response || "";
  }

  function render() {
    refs.formatSelect.value = documentData.page.format;
    refs.orientationSelect.value = documentData.page.orientation;
    refs.gridSizeInput.value = documentData.grid.size;
    refs.snapToggle.checked = documentData.grid.snap;
    refs.headerToggle.checked = documentData.regions?.header?.enabled ?? true;
    refs.footerToggle.checked = documentData.regions?.footer?.enabled ?? true;

    renderTabs(
      refs.languageTabsHost,
      documentData.languages.map((language) => ({
        id: language.id,
        label: language.label,
      })),
      state.activeLanguageId,
      (id) => {
        state.activeLanguageId = id;
        state.selectedBlockId = null;
        state.editingBlockId = null;
        render();
      }
    );

    renderCanvas();
    renderMeta();
    renderLanguageActions();
    renderAiPanel();
    focusEditingBlock();
    createIcons({ icons });
  }

  return {
    render,
    renderCanvas,
    renderAiPanel,
  };
}
