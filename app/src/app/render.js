import { createIcons, icons } from "lucide";
import { createEditor, createEditorCommands } from "../editor/editor.js";
import { createToolbar } from "../ui/toolbar.js";
import { createBlockElement } from "../blocks/blockRenderer.js";
import { setupDragResize } from "../blocks/dragResize.js";
import { getPageSize } from "./textUtils.js";
import { getDefaultLanguageId } from "./translationFlow.js";

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

    const activeBlocks = blocks.filter(
      (block) => block.languageId === state.activeLanguageId
    );

    documentData.pages.forEach((page) => {
      const pageWrapper = document.createElement("div");
      pageWrapper.className = "page-shell";

      const { width, height } = getPageSize(
        documentData.page.format,
        documentData.page.orientation
      );

      const pageHeader = document.createElement("div");
      pageHeader.className = "mb-2 flex items-center justify-between text-xs text-slate-500";
      pageHeader.textContent = page.name;
      pageWrapper.append(pageHeader);

      const pageSurface = document.createElement("div");
      const isActivePage = page.id === state.activePageId;
      pageSurface.className = documentData.grid.snap
        ? "page-surface grid-on"
        : "page-surface";
      if (isActivePage) {
        pageSurface.classList.add("is-active");
      }
      pageSurface.style.width = `${width}px`;
      pageSurface.style.height = `${height}px`;
      pageSurface.style.setProperty("--grid-size", `${documentData.grid.size}px`);
      pageWrapper.append(pageSurface);

      pageSurface.addEventListener("click", () => {
        if (state.activePageId !== page.id) {
          state.activePageId = page.id;
          render();
        }
      });

      const pageBlocks = activeBlocks.filter((block) => block.pageId === page.id);

      if (pageBlocks.length === 0) {
        const empty = document.createElement("div");
        empty.className = "absolute inset-0 flex items-center justify-center text-sm text-slate-300";
        empty.textContent = "Sem blocos";
        pageSurface.append(empty);
      }

      pageBlocks.forEach((block) => {
        const isSelected = block.id === state.selectedBlockId;
        const isEditing = block.id === state.editingBlockId;
        const { element, editorHost } = createBlockElement(block, {
          selected: isSelected,
          editing: isEditing,
        });
        pageSurface.append(element);

        if (isEditing && block.type === "table") {
          const toolbar = createToolbar(null, { disabled: true });
          toolbar.classList.add("block-toolbar");
          element.append(toolbar);
        }

        element.addEventListener("click", (event) => {
          event.stopPropagation();
          const nextSelected = block.id;
          const nextEditing =
            state.editingBlockId && state.editingBlockId !== block.id
              ? null
              : state.editingBlockId;
          const shouldRender =
            state.selectedBlockId !== nextSelected ||
            state.editingBlockId !== nextEditing;
          state.selectedBlockId = nextSelected;
          state.editingBlockId = nextEditing;
          if (shouldRender) {
            render();
          }
        });

        element.addEventListener("dblclick", (event) => {
          event.stopPropagation();
          if (block.type === "image") {
            return;
          }
          const shouldRender =
            state.editingBlockId !== block.id || state.selectedBlockId !== block.id;
          state.selectedBlockId = block.id;
          state.editingBlockId = block.id;
          if (shouldRender) {
            render();
          }
        });

        if (editorHost) {
          const view = createEditor({
            mount: editorHost,
            content: block.content || undefined,
            editable: () => block.id === state.editingBlockId,
            onChange: (nextState) => {
              block.content = nextState.doc.toJSON();
            },
          });
          state.views.push(view);

          if (isEditing) {
            const toolbar = createToolbar(createEditorCommands(view));
            toolbar.classList.add("block-toolbar");
            element.append(toolbar);
          }
        }

        const interaction = setupDragResize({
          element,
          block,
          gridSize: documentData.grid.size,
          snapEnabled: documentData.grid.snap,
        });
        interaction.setEnabled(!isEditing);
        state.interactions.push(interaction);
      });

      refs.canvas.append(pageWrapper);
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
      "inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700";
    button.innerHTML = '<i data-lucide="rotate-ccw"></i>Atualizar';
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
