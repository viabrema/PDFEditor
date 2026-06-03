import { hydrateLucideIcons } from "../ui/hydrateLucideIcons";
import { mountTableFormatToolbar } from "./renderTableToolbar";
import { getPropertiesPanelBlock, propertiesPanelMode } from "./propertiesPanelBlock";
import {
  appendHint,
  findBlockElement,
  renderChartPanel,
  renderLinkedTablePanel,
  renderImagePanel,
  renderTextPanel,
} from "./renderPropertiesSidebarPanels";
import { getPageSize } from "./textUtils";
import type { DocumentHistory } from "./documentHistory";

const BLOCK_TYPE_LABELS: Record<string, string> = {
  text: "Texto",
  heading: "Titulo",
  table: "Tabela",
  linkedTable: "Tabela Excel",
  chart: "Grafico",
  image: "Imagem",
};

function finishPropertiesSidebarIcons(refs: { propertiesSidebar?: unknown }) {
  hydrateLucideIcons(refs.propertiesSidebar as HTMLElement | undefined);
}

export function renderPropertiesSidebar({
  refs,
  state,
  blocks,
  documentData,
  documentHistory,
  requestRender,
  linkedTableBridge,
  linkedChartBridge,
}: {
  refs: any;
  state: any;
  blocks: any[];
  documentData: any;
  documentHistory?: DocumentHistory;
  requestRender: () => void;
  linkedTableBridge?: { reconfigure?: (block: any) => Promise<void> };
  linkedChartBridge?: { reconfigure?: (block: any) => Promise<void> };
}) {
  const mode = propertiesPanelMode(state, blocks);
  const pagePanel = refs.propertiesSidebarPagePanel as HTMLElement | null;
  const blockPanel = refs.propertiesSidebarBlockPanel as HTMLElement | null;
  const titleEl = refs.propertiesSidebarTitle as HTMLElement | null;
  const subtitleEl = refs.propertiesSidebarSubtitle as HTMLElement | null;
  const dimensionsEl = refs.pageDimensions as HTMLElement | null;

  if (dimensionsEl) {
    const { width, height } = getPageSize(documentData.page.format, documentData.page.orientation);
    dimensionsEl.textContent = `Resolucao: ${width} x ${height} px`;
  }

  if (!pagePanel || !blockPanel) {
    return;
  }

  pagePanel.classList.toggle("hidden", mode !== "page");
  blockPanel.classList.toggle("hidden", mode !== "block");
  blockPanel.innerHTML = "";

  if (mode === "page") {
    if (titleEl) {
      titleEl.textContent = "Pagina";
    }
    if (subtitleEl) {
      subtitleEl.textContent = "Formato, orientacao e grelha";
    }
    const hintId = "properties-page-hint";
    let hint = pagePanel.querySelector(`#${hintId}`) as HTMLElement | null;
    if (!hint) {
      hint = document.createElement("p");
      hint.id = hintId;
      hint.className = "text-xs leading-relaxed text-slate-500";
      pagePanel.append(hint);
    }
    hint.textContent =
      "Clique num bloco no canvas para ver as propriedades de formatacao (texto, tabela, grafico, etc.).";
    return;
  }
  pagePanel.querySelector("#properties-page-hint")?.remove();

  if (mode === "multi") {
    if (titleEl) {
      titleEl.textContent = "Selecao";
    }
    if (subtitleEl) {
      const n = state.selectedBlockIds.length;
      subtitleEl.textContent = `${n} blocos selecionados`;
    }
    appendHint(
      blockPanel,
      "Use Cmd/Ctrl+clique para ajustar a selecao. As propriedades aparecem ao selecionar um unico bloco.",
    );
    blockPanel.classList.remove("hidden");
    return;
  }

  const block = getPropertiesPanelBlock(state, blocks);
  if (!block) {
    return;
  }

  const label = BLOCK_TYPE_LABELS[block.type] || block.type;
  if (titleEl) {
    titleEl.textContent = label;
  }
  if (subtitleEl) {
    subtitleEl.textContent = state.editingBlockId === block.id ? "A editar" : "Selecionado";
  }

  if (block.type === "linkedTable") {
    const element = findBlockElement(block.id);
    if (!element) {
      appendHint(blockPanel, "Tabela nao visivel nesta pagina.");
    } else if (state.editingBlockId !== block.id) {
      appendHint(
        blockPanel,
        "Arraste as alcas para redimensionar. Duplo clique para editar estrutura e formato visual. Atualizar Excel so altera os dados.",
      );
      renderLinkedTablePanel(blockPanel, block, documentHistory, requestRender, linkedTableBridge);
    } else {
      if (state.tableEdit?.typing) {
        appendHint(blockPanel, "A editar texto na celula. Formato aplica na selecao atual.");
      } else {
        appendHint(
          blockPanel,
          "Clique nos marcadores ou numa celula. Arraste a borda no topo da coluna para redimensionar. Duplo clique na celula para digitar.",
        );
      }
      const toolbar = mountTableFormatToolbar({
        block,
        state,
        element,
        documentHistory,
        requestRender,
        linkedTableBridge,
        layout: "sidebar",
      });
      blockPanel.append(toolbar);
    }
    finishPropertiesSidebarIcons(refs);
    return;
  }

  if (block.type === "table") {
    const element = findBlockElement(block.id);
    if (!element) {
      appendHint(blockPanel, "Tabela nao visivel nesta pagina.");
    } else if (state.editingBlockId !== block.id) {
      appendHint(
        blockPanel,
        "Arraste as alcas para redimensionar. Duplo clique na tabela para selecionar linhas, colunas ou celulas e formatar.",
      );
    } else {
      if (state.tableEdit?.typing) {
        appendHint(blockPanel, "A editar texto na celula. Formato aplica na selecao atual.");
      } else {
        appendHint(
          blockPanel,
          "Clique nos marcadores ou numa celula. Arraste a borda no topo da coluna para redimensionar. Duplo clique na celula para digitar.",
        );
      }
      const toolbar = mountTableFormatToolbar({
        block,
        state,
        element,
        documentHistory,
        requestRender,
        linkedTableBridge,
        layout: "sidebar",
      });
      blockPanel.append(toolbar);
    }
    finishPropertiesSidebarIcons(refs);
    return;
  }

  if (block.type === "chart") {
    renderChartPanel(blockPanel, block, state, documentHistory, requestRender, linkedChartBridge);
    finishPropertiesSidebarIcons(refs);
    return;
  }

  if (block.type === "image") {
    renderImagePanel(blockPanel, block, documentHistory, requestRender);
    return;
  }

  if (block.type === "text" || block.type === "heading" || block.type === "title" || block.type === "subtitle") {
    renderTextPanel(blockPanel, block, state, documentHistory, requestRender);
    finishPropertiesSidebarIcons(refs);
  }
}
