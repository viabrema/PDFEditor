import { setLastAction } from "./activityLog";
import { getDefaultLanguageId } from "./translationLanguage";
import { translateBlockFromSource } from "./translationBlock";

export {
  getDefaultLanguageId,
  effectiveBlockLanguageId,
  getLanguagePromptLabel,
} from "./translationLanguage";

export { translateTextValue, translateTextBatch, translateTextDoc } from "./translationBatch";

export { translateBlockFromSource } from "./translationBlock";

export async function translateFromDefaultLanguage({
  translationService,
  documentData,
  state,
  blocks,
  render,
  targetLanguageId,
}) {
  const sourceLanguageId = getDefaultLanguageId(documentData);
  if (!sourceLanguageId || !targetLanguageId) {
    return;
  }

  state.translation.loading = true;
  state.translation.error = null;
  render();

  try {
    for (const block of blocks) {
      if (block.languageId == null || block.languageId === "") {
        block.languageId = sourceLanguageId;
      }
    }

    const sourceBlocks = blocks.filter((block) => block.languageId === sourceLanguageId);
    const translatedBlocks = [];
    for (const block of sourceBlocks) {
      translatedBlocks.push(
        await translateBlockFromSource({
          translationService,
          documentData,
          block,
          sourceLanguageId,
          targetLanguageId,
          allBlocks: blocks,
        })
      );
    }

    const remaining = blocks.filter((block) => block.languageId !== targetLanguageId);
    blocks.length = 0;
    blocks.push(...remaining, ...translatedBlocks);
    setLastAction(state, "Traducao concluida.");
  } catch (error) {
    state.translation.error = "Falha ao traduzir.";
    setLastAction(state, "Traducao falhou.");
  } finally {
    state.translation.loading = false;
    render();
  }
}
