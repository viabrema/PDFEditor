import {
  buildDocumentAiPrompt,
  isAnalysisInstruction,
  isFormattingInstruction,
  type DocumentLayoutEntry,
  type FocusedBlockEntry,
} from "./aiPrompts";
import { applyAiResultToPage } from "./aiApply";
import { getPageSize } from "./textUtils";
import { effectiveBlockLanguageId, getLanguagePromptLabel } from "./translationFlow";
import {
  blockRegion,
  serializeBlockForAi,
  summarizeBlockForLayout,
} from "./aiBlockSerialize";

export const AI_DOCUMENT_CHAT_KEY = "ai:document";

export function createAiFlow({ blocks, state, documentData }) {
  function getSelectedBlocksInOrder() {
    return state.selectedBlockIds
      .map((id) => blocks.find((block) => block.id === id))
      .filter((b): b is NonNullable<typeof b> => Boolean(b));
  }

  /** Ultimo bloco clicado na selecao (compat com fluxos que esperam um “principal”). */
  function getPrimarySelectedBlock() {
    const ids = state.selectedBlockIds;
    if (ids.length === 0) {
      return null;
    }
    return blocks.find((block) => block.id === ids[ids.length - 1]) || null;
  }

  function getBlocksForActiveLanguage() {
    return blocks.filter(
      (block) => effectiveBlockLanguageId(block, documentData) === state.activeLanguageId,
    );
  }

  function getDocumentLayoutSnapshot(): DocumentLayoutEntry[] {
    const pages = documentData.pages || [];
    const pageMeta = new Map(
      pages.map((page: { id: string; name?: string }, index: number) => [
        page.id,
        { index, name: page.name || page.id },
      ]),
    );
    return getBlocksForActiveLanguage().map((block) => {
      const meta = pageMeta.get(block.pageId) || { index: 0, name: block.pageId || "?" };
      return {
        id: block.id,
        pageId: block.pageId,
        pageIndex: meta.index + 1,
        pageName: meta.name,
        region: blockRegion(block),
        type: block.type,
        position: block.position,
        size: block.size,
        summary: summarizeBlockForLayout(block),
      };
    });
  }

  function getFocusedBlocksForPrompt(): FocusedBlockEntry[] {
    return state.selectedBlockIds
      .map((id, index) => {
        const block = blocks.find((b) => b.id === id);
        if (!block) {
          return null;
        }
        if (effectiveBlockLanguageId(block, documentData) !== state.activeLanguageId) {
          return null;
        }
        return {
          focusOrder: index + 1,
          snapshot: serializeBlockForAi(block) as Record<string, unknown>,
        };
      })
      .filter(Boolean) as FocusedBlockEntry[];
  }

  function buildDocumentPrompt({ instruction, mode }) {
    const activeLanguageLabel = getLanguagePromptLabel(documentData, state.activeLanguageId);
    return buildDocumentAiPrompt({
      activeLanguageLabel,
      documentLayout: getDocumentLayoutSnapshot(),
      focusedBlocks: getFocusedBlocksForPrompt(),
      instruction,
      mode,
      pageSize: getPageSize(documentData?.page?.format, documentData?.page?.orientation),
      gridSize: documentData?.grid?.size,
    });
  }

  function getModeForInstruction(instruction) {
    if (isAnalysisInstruction(instruction)) {
      return "analysis";
    }
    if (isFormattingInstruction(instruction)) {
      return "format";
    }
    return "edit";
  }

  return {
    getSelectedBlocksInOrder,
    getPrimarySelectedBlock,
    getBlocksForActiveLanguage,
    getDocumentLayoutSnapshot,
    getFocusedBlocksForPrompt,
    buildDocumentPrompt,
    applyAiResultToPage: ({ resultText }) =>
      applyAiResultToPage({ resultText, blocks, state, documentData }),
    getModeForInstruction,
    getChatKey: () => AI_DOCUMENT_CHAT_KEY,
  };
}
