import {
  applyTableDomMode,
  resolveTableDomMode,
} from "../blocks/tableBlock";
import type { DocumentHistory } from "./documentHistory";
import { renderPropertiesSidebar } from "./renderPropertiesSidebar";

export function refreshTableChromeForDocument({
  state,
  blocks,
  refs,
  documentData,
  documentHistory,
  requestRender,
  linkedTableBridge,
  linkedChartBridge,
}: {
  state: any;
  blocks: any[];
  refs: any;
  documentData: any;
  documentHistory?: DocumentHistory;
  requestRender: () => void;
  linkedTableBridge?: { reconfigure?: (block: any) => Promise<void> };
  linkedChartBridge?: { reconfigure?: (block: any) => Promise<void> };
}) {
  const edit =
    state.editingBlockId && state.tableEdit?.blockId === state.editingBlockId
      ? state.tableEdit
      : null;
  const targetIds = new Set<string>();
  if (edit?.blockId) {
    targetIds.add(edit.blockId);
  } else if (state.tableEdit?.blockId) {
    targetIds.add(state.tableEdit.blockId);
  }
  for (const id of state.selectedBlockIds || []) {
    targetIds.add(id);
  }

  for (const blockId of targetIds) {
    const block = blocks.find((b: { id: string }) => b.id === blockId);
    if (!block || (block.type !== "table" && block.type !== "linkedTable")) {
      continue;
    }
    const shell = document.querySelector(
      `.block-shell[data-block-id="${blockId}"]`,
    );
    const table = shell?.querySelector("table.table-block") as HTMLTableElement | undefined;
    if (!table) {
      continue;
    }
    const tableEdit = edit?.blockId === blockId ? edit : null;
    const mode = resolveTableDomMode(blockId, state.editingBlockId, tableEdit);
    applyTableDomMode(table, mode, tableEdit, { block });
  }

  if (!edit) {
    renderPropertiesSidebar({
      refs,
      state,
      blocks,
      documentData,
      documentHistory,
      requestRender,
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
    requestRender,
    linkedTableBridge,
    linkedChartBridge,
  });
  if (edit.typing) {
    const shell = document.querySelector(
      `.block-shell[data-block-id="${edit.blockId}"]`,
    );
    const cell = shell?.querySelector("td.is-typing-cell");
    (cell as HTMLElement | undefined)?.focus();
  }
}
