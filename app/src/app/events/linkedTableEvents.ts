import { createLinkedTableBlockFromRows } from "../../blocks/tableBlock";
import { refreshChartsUsingTableBlock } from "../../blocks/chartRefresh";
import { getLinkedTablesToRefresh, loadExcelLinkTableContent } from "../../services/excelLink";
import { getTauriBackend } from "../../services/tauriStorage";
import { getBlockInsertionRegionContext } from "../blockInsertionContext";
import { runExcelLinkSetup, type ExcelLinkModalRefs } from "../linkedTableWizard";
import { getNextBlockPosition } from "../textUtils";
import { setLastAction } from "../activityLog";

function getExcelModalRefs(refs: any): ExcelLinkModalRefs {
  return {
    modal: refs.excelLinkModal,
    sheetSelect: refs.excelLinkSheetSelect,
    rangeInput: refs.excelLinkRangeInput,
    errorEl: refs.excelLinkModalError,
    confirmBtn: refs.excelLinkConfirm,
    cancelBtn: refs.excelLinkCancel,
  };
}

export function bindLinkedTableEvents({
  documentData,
  state,
  blocks,
  refs,
  renderer,
  linkedTableBridge,
}: any) {
  if (
    !refs?.addLinkedTableButton ||
    !refs?.refreshLinkedTablesButton ||
    !refs?.excelLinkFileInput ||
    !refs?.excelLinkModal
  ) {
    return;
  }

  linkedTableBridge.reconfigure = async (block: any) => {
    const tauri = await getTauriBackend();
    const link = block.metadata?.excelLink;
    const result = await runExcelLinkSetup({
      tauri,
      modalRefs: getExcelModalRefs(refs),
      fileInput: refs.excelLinkFileInput,
      defaults: link
        ? { sheetName: link.sheetName, range: link.range }
        : undefined,
    });
    if (!result) {
      return;
    }
    block.content = { ...(block.content || {}), rows: result.rows, merges: result.merges };
    if (result.cellStyles) {
      block.content.cellStyles = result.cellStyles;
    } else {
      delete block.content.cellStyles;
    }
    if (result.rowHeights) {
      block.content.rowHeights = result.rowHeights;
    } else {
      delete block.content.rowHeights;
    }
    block.metadata = {
      ...(block.metadata || {}),
      excelLink: {
        filePath: result.filePath,
        sheetName: result.sheetName,
        range: result.range,
      },
    };
    setLastAction(state, "Tabela linkada reconfigurada.");
    renderer.render();
  };

  refs.addLinkedTableButton.addEventListener("click", async () => {
    const tauri = await getTauriBackend();
    const result = await runExcelLinkSetup({
      tauri,
      modalRefs: getExcelModalRefs(refs),
      fileInput: refs.excelLinkFileInput,
    });
    if (!result) {
      return;
    }
    const ctx = getBlockInsertionRegionContext({ documentData, state, blocks });
    const position = getNextBlockPosition({
      blocksForPage: ctx.blocksForRegion,
      blockSize: { width: 520, height: 220 },
      pageSize: ctx.regionSize,
    });
    const block = createLinkedTableBlockFromRows(
      result.rows,
      {
        filePath: result.filePath,
        sheetName: result.sheetName,
        range: result.range,
      },
      {
        pageId: ctx.isBody ? state.activePageId : null,
        languageId: state.activeLanguageId,
        position,
        pageSize: ctx.regionSize,
        metadata: ctx.isBody ? {} : { region: ctx.region },
        merges: result.merges,
        cellStyles: result.cellStyles,
        rowHeights: result.rowHeights,
      },
    );
    blocks.push(block);
    setLastAction(state, "Tabela linkada ao Excel inserida.");
    renderer.renderCanvas();
  });

  refs.refreshLinkedTablesButton.addEventListener("click", async () => {
    const targets = getLinkedTablesToRefresh(blocks, state.selectedBlockIds);
    if (targets.length === 0) {
      window.alert("Nao ha tabelas linkadas para atualizar.");
      return;
    }
    const errors: string[] = [];
    const refreshedIds: string[] = [];
    for (const block of targets) {
      const link = block.metadata?.excelLink;
      if (!link) {
        errors.push(`Bloco ${block.id}: sem dados de link.`);
        continue;
      }
      try {
        const data = await loadExcelLinkTableContent(link);
        block.content = { ...(block.content || {}), rows: data.rows, merges: data.merges };
        if (data.cellStyles) {
          block.content.cellStyles = data.cellStyles;
        } else {
          delete block.content.cellStyles;
        }
        if (data.rowHeights) {
          block.content.rowHeights = data.rowHeights;
        } else {
          delete block.content.rowHeights;
        }
        refreshedIds.push(block.id);
      } catch (e) {
        const msg =
          e instanceof Error
            ? e.message
            : "Nao foi possivel ler o ficheiro (pode ter sido movido ou apagado).";
        errors.push(`Bloco ${block.id}: ${msg}`);
      }
    }
    for (const id of refreshedIds) {
      refreshChartsUsingTableBlock(id, blocks);
    }
    renderer.renderCanvas();
    setLastAction(
      state,
      errors.length > 0
        ? "Atualizacao Excel concluida com erros."
        : "Tabelas linkadas atualizadas.",
    );
    if (errors.length > 0) {
      window.alert(errors.join("\n\n"));
    }
  });
}
