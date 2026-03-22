import { createIcons, icons } from "lucide";
import { getDefaultLanguageId } from "./translationFlow";
import { renderCanvasView } from "./renderCanvas";
import { syncStatusBar } from "./canvasZoom";
import { setLastAction } from "./activityLog";
import { destroyAllBlockCharts } from "../blocks/chartRuntime";

export function createRenderer({
  documentData,
  state,
  blocks,
  refs,
  translateFromDefaultLanguage,
  aiFlow,
  linkedTableBridge,
}: {
  documentData: any;
  state: any;
  blocks: any[];
  refs: any;
  translateFromDefaultLanguage: (id: string) => void;
  aiFlow: any;
  linkedTableBridge?: { reconfigure?: (block: any) => Promise<void> };
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

    const cell = element.querySelector("td");
    if (cell) {
      cell.focus();
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
      linkedTableBridge,
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
    refs.aiPanel.classList.toggle("is-open", state.ai.open);
    refs.aiPanel.setAttribute("aria-hidden", state.ai.open ? "false" : "true");

    const lang = documentData.languages.find(
      (l: { id: string }) => l.id === state.activeLanguageId,
    );
    refs.aiTarget.textContent =
      `Layout completo no idioma ${lang?.label ?? state.activeLanguageId}. ` +
      "Cmd ou Ctrl+clique para selecionar varios blocos.";

    const chipsHost = refs.aiSelectionChips as HTMLElement | null;
    if (chipsHost) {
      chipsHost.innerHTML = "";
      const ordered = aiFlow.getSelectedBlocksInOrder();
      chipsHost.classList.toggle("is-empty", ordered.length === 0);
      ordered.forEach((block: { id: string; type: string }, index: number) => {
        const row = document.createElement("div");
        row.className = "ai-selection-chip";
        const label = document.createElement("span");
        label.className = "ai-selection-chip-label";
        const shortId = block.id.length > 10 ? `…${block.id.slice(-8)}` : block.id;
        label.textContent = `#${index + 1} ${block.type} · ${shortId}`;
        const rm = document.createElement("button");
        rm.type = "button";
        rm.className = "ai-selection-chip-remove";
        rm.setAttribute("aria-label", "Remover da selecao");
        rm.textContent = "×";
        rm.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          state.selectedBlockIds = state.selectedBlockIds.filter((id: string) => id !== block.id);
          render();
        });
        row.append(label, rm);
        chipsHost.append(row);
      });
    }

    refs.aiSend.disabled = state.ai.loading;
    refs.aiStatus.textContent = state.ai.loading ? "Processando..." : state.ai.error || "";

    const historyHost = refs.aiHistory as HTMLElement | null;
    if (historyHost) {
      historyHost.innerHTML = "";
      const entries = state.ai.history || [];
      entries.forEach((entry: { role: string; text: string }) => {
        const wrap = document.createElement("div");
        wrap.className =
          entry.role === "user"
            ? "ai-history-msg ai-history-msg-user"
            : "ai-history-msg ai-history-msg-assistant";
        const roleEl = document.createElement("div");
        roleEl.className = "ai-history-msg-role";
        roleEl.textContent = entry.role === "user" ? "Voce" : "Assistente";
        const body = document.createElement("div");
        body.className = "ai-history-msg-body";
        body.textContent = entry.text;
        wrap.append(roleEl, body);
        historyHost.append(wrap);
      });
      if (state.ai.loading) {
        const pending = document.createElement("div");
        pending.className = "ai-history-msg ai-history-msg-assistant ai-history-msg-pending";
        const roleEl = document.createElement("div");
        roleEl.className = "ai-history-msg-role";
        roleEl.textContent = "Assistente";
        const body = document.createElement("div");
        body.className = "ai-history-msg-body";
        body.textContent = "A processar...";
        pending.append(roleEl, body);
        historyHost.append(pending);
      }
      requestAnimationFrame(() => {
        historyHost.scrollTop = historyHost.scrollHeight;
      });
    }
  }

  function render() {
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
        const lang = documentData.languages.find((l: { id: string }) => l.id === id);
        setLastAction(state, `Idioma: ${lang?.label ?? id}.`);
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
