export {
  TABLE_BLOCK_BASE_FONT_PX,
  TABLE_CELL_EMPTY_PLACEHOLDER,
  cellValueForDisplay,
  cellValueFromDisplay,
  clampLinkedTableFontScale,
  parseTabularText,
  normalizeRows,
  createEmptyTable,
  computeTableSize,
  createTableBlockFromRows,
  createTableBlockFromText,
  createLinkedTableBlockFromRows,
  readTableRows,
} from "./tableBlockData";

export {
  updateTableBody,
  setTableEditable,
  attachTableHandlers,
  syncTableElementWithBlock,
  createTableElement,
  applyTableDomMode,
  normalizeTypingCellContent,
  refreshTableSelectionChrome,
  resolveTableDomMode,
} from "./tableBlockDom";

export type {
  UpdateTableBodyOptions,
  TableDomConfig,
  TableDomMode,
  TableEditState,
} from "./tableBlockDom";
