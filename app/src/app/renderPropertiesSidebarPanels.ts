import {
  createEditorCommands,
  editorHasPartialTextSelection,
  runSidebarEditorCommand,
} from "../editor/editor";
import { createToolbar } from "../ui/toolbar";
import { getBlockTextStyle } from "../blocks/blockStyles";
import { chartBlockHasExcelLink } from "../blocks/chartBlock";
import { clampLinkedTableFontScale } from "../blocks/tableBlock";
import { openChartConfiguration } from "./chartModal";
import { openLinkedTableDataSource } from "./linkedTableDataModal";
import type { DocumentHistory } from "./documentHistory";

export function findBlockElement(blockId: string): HTMLElement | null {
  return document.querySelector(`.block-shell[data-block-id="${blockId}"]`) as HTMLElement | null;
}

export function findEditorViewForBlock(blockId: string, views: { dom: Node }[]) {
  const host = findBlockElement(blockId)?.querySelector(".prose-editor");
  if (!host) {
    return null;
  }
  return views.find((view) => host.contains(view.dom)) ?? null;
}

export function appendHint(host: HTMLElement, text: string) {
  const p = document.createElement("p");
  p.className = "text-xs leading-relaxed text-slate-500";
  p.textContent = text;
  host.append(p);
}

export function renderImagePanel(
  host: HTMLElement,
  block: any,
  documentHistory: DocumentHistory | undefined,
  requestRender: () => void,
) {
  appendHint(host, "Duplo clique na imagem para substituir o ficheiro.");
  const toolbar = createToolbar(null, {
    variant: "table",
    layout: "sidebar",
    hiddenValue: block.metadata?.hidden === true,
    onToggleHidden: (hidden: boolean) => {
      documentHistory?.checkpointBeforeChange();
      block.metadata = { ...(block.metadata || {}), hidden };
      requestRender();
    },
  });
  host.append(toolbar);
}

export function renderLinkedTablePanel(
  host: HTMLElement,
  block: any,
  documentHistory: DocumentHistory | undefined,
  requestRender: () => void,
  linkedTableBridge?: { reconfigure?: (block: any) => Promise<void> },
) {
  const toolbar = createToolbar(null, {
    variant: "linkedTable",
    layout: "sidebar",
    fontScaleValue: clampLinkedTableFontScale(block.metadata?.fontScale),
    onFontScaleChange: (scale: number) => {
      documentHistory?.checkpointBeforeChange();
      block.metadata = { ...(block.metadata || {}), fontScale: scale };
      requestRender();
    },
    onLinkedTableDataSource: () => openLinkedTableDataSource(block),
    onLinkedTableExcelConfigure: linkedTableBridge?.reconfigure
      ? () => linkedTableBridge.reconfigure!(block)
      : undefined,
    hiddenValue: block.metadata?.hidden === true,
    onToggleHidden: (hidden: boolean) => {
      documentHistory?.checkpointBeforeChange();
      block.metadata = { ...(block.metadata || {}), hidden };
      requestRender();
    },
  });
  host.append(toolbar);
}

export function renderChartPanel(
  host: HTMLElement,
  block: any,
  state: any,
  documentHistory: DocumentHistory | undefined,
  requestRender: () => void,
  linkedChartBridge?: { reconfigure?: (block: any) => Promise<void> },
) {
  if (chartBlockHasExcelLink(block)) {
    const toolbar = createToolbar(null, {
      variant: "linkedChart",
      layout: "sidebar",
      fontScaleValue: clampLinkedTableFontScale(block.metadata?.fontScale),
      onFontScaleChange: (scale: number) => {
        documentHistory?.checkpointBeforeChange();
        block.metadata = { ...(block.metadata || {}), fontScale: scale };
        requestRender();
      },
      onLinkedChartExcelConfigure: linkedChartBridge?.reconfigure
        ? () => linkedChartBridge.reconfigure!(block)
        : undefined,
      onLinkedChartDesignConfigure: () => openChartConfiguration(block),
      hiddenValue: block.metadata?.hidden === true,
      onToggleHidden: (hidden: boolean) => {
        documentHistory?.checkpointBeforeChange();
        block.metadata = { ...(block.metadata || {}), hidden };
        requestRender();
      },
    });
    host.append(toolbar);
    return;
  }
  appendHint(host, "Duplo clique para abrir o configurador do grafico.");
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className =
    "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-400";
  btn.textContent = "Configurar grafico";
  btn.addEventListener("click", () => {
    state.activePageId = block.pageId;
    openChartConfiguration(block);
    requestRender();
  });
  host.append(btn);
}

export function renderTextPanel(
  host: HTMLElement,
  block: any,
  state: any,
  documentHistory: DocumentHistory | undefined,
  requestRender: () => void,
) {
  const view = findEditorViewForBlock(block.id, state.views || []);
  const isEditing = state.editingBlockId === block.id;
  if (!view) {
    appendHint(host, "Bloco de texto indisponivel. Selecione novamente.");
    return;
  }
  const partialSelection = isEditing && editorHasPartialTextSelection(view);
  if (!isEditing) {
    appendHint(host, "Duplo clique no bloco para editar o texto. Formatacao abaixo aplica ao bloco inteiro.");
  } else if (partialSelection) {
    appendHint(host, "Formatacao aplica-se apenas ao texto selecionado.");
  } else {
    appendHint(host, "Sem texto selecionado: formatacao aplica-se ao bloco inteiro.");
  }

  const runFormattingCommand = (fn: (() => unknown) | undefined) => {
    if (!fn) {
      return;
    }
    documentHistory?.checkpointBeforeChange();
    runSidebarEditorCommand(view, { editMode: isEditing }, fn);
  };

  const wrapBlockCommand = (fn: (() => unknown) | undefined) => {
    if (!fn) {
      return undefined;
    }
    return () => runFormattingCommand(fn);
  };

  const applyBlockStyles = () => {
    const style = getBlockTextStyle(block);
    const el = findBlockElement(block.id);
    const target = (el?.querySelector(".ProseMirror") || el?.querySelector(".prose-editor")) as
      | HTMLElement
      | undefined;
    if (!target) {
      return;
    }
    target.style.fontSize = style.fontSize;
    target.style.fontFamily = style.fontFamily;
    target.style.fontWeight = style.fontWeight;
    target.style.color = style.color;
    target.style.textAlign = style.textAlign;
  };

  const isHeading = block.type === "heading";
  const headingLevel = Number(block.metadata?.headingLevel ?? block.metadata?.level) || 1;
  const commands = createEditorCommands(view);
  const toolbar = createToolbar(
    {
      toggleBold: wrapBlockCommand(commands.toggleBold),
      toggleItalic: wrapBlockCommand(commands.toggleItalic),
      toggleBulletList: wrapBlockCommand(commands.toggleBulletList),
      toggleOrderedList: wrapBlockCommand(commands.toggleOrderedList),
    },
    {
    variant: isHeading ? "heading" : "text",
    layout: "sidebar",
    alignValue: block.metadata?.align || "left",
    fontFamilyValue: block.metadata?.fontFamily || "Segoe UI",
    fontSizeValue: block.metadata?.fontSize || getBlockTextStyle(block).fontSize,
    headingLevelValue: Math.min(3, Math.max(1, headingLevel)),
    onAlignChange: (align: string) => {
      if (partialSelection) {
        runFormattingCommand(() => commands.setTextAlign(align));
        return;
      }
      documentHistory?.checkpointBeforeChange();
      block.metadata = { ...(block.metadata || {}), align };
      applyBlockStyles();
      requestRender();
    },
    onFontFamilyChange: (fontFamily: string) => {
      if (partialSelection) {
        runFormattingCommand(() => commands.setFontFamily(fontFamily));
        return;
      }
      documentHistory?.checkpointBeforeChange();
      block.metadata = { ...(block.metadata || {}), fontFamily };
      applyBlockStyles();
      requestRender();
    },
    onFontSizeChange: (fontSize: string) => {
      if (partialSelection) {
        runFormattingCommand(() => commands.setFontSize(fontSize));
        return;
      }
      documentHistory?.checkpointBeforeChange();
      block.metadata = { ...(block.metadata || {}), fontSize };
      applyBlockStyles();
      requestRender();
    },
    onHeadingLevelChange: (level: number) => {
      if (partialSelection) {
        runFormattingCommand(() => commands.setHeading(level));
        return;
      }
      documentHistory?.checkpointBeforeChange();
      block.metadata = { ...(block.metadata || {}), headingLevel: level };
      applyBlockStyles();
      requestRender();
    },
    hiddenValue: block.metadata?.hidden === true,
    onToggleHidden: (hidden: boolean) => {
      documentHistory?.checkpointBeforeChange();
      block.metadata = { ...(block.metadata || {}), hidden };
      requestRender();
    },
    },
  );
  host.append(toolbar);
}
