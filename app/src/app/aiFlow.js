import {
  buildAiPrompt,
  buildPageAiPrompt,
  isAnalysisInstruction,
  isFormattingInstruction,
} from "./aiPrompts.js";
import { applyAiResultToBlock, applyAiResultToPage } from "./aiApply.js";

export function createAiFlow({ blocks, state }) {
  function getSelectedBlock() {
    return blocks.find((block) => block.id === state.selectedBlockId) || null;
  }

  function getActivePageBlocks() {
    return blocks.filter(
      (block) =>
        block.pageId === state.activePageId &&
        block.languageId === state.activeLanguageId
    );
  }

  function getPageBlockSnapshot() {
    return getActivePageBlocks().map((block) => {
      if (block.type === "table") {
        return {
          id: block.id,
          type: block.type,
          position: block.position,
          size: block.size,
          content: block.content?.rows || [],
        };
      }
      if (block.type === "image") {
        return {
          id: block.id,
          type: block.type,
          position: block.position,
          size: block.size,
          content: { src: block.content?.src || "" },
        };
      }
      return {
        id: block.id,
        type: block.type,
        position: block.position,
        size: block.size,
        content: block.content,
      };
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

  function getChatKey(selectedBlock) {
    return selectedBlock ? selectedBlock.id : `page:${state.activePageId}`;
  }

  return {
    getSelectedBlock,
    getActivePageBlocks,
    buildAiPrompt,
    buildPageAiPrompt: ({ instruction, mode }) =>
      buildPageAiPrompt({
        pageBlocks: getPageBlockSnapshot(),
        instruction,
        mode,
      }),
    applyAiResultToBlock,
    applyAiResultToPage: ({ resultText }) =>
      applyAiResultToPage({ resultText, blocks, state }),
    getModeForInstruction,
    getChatKey,
  };
}
