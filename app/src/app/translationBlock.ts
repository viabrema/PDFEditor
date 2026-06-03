import { createBlock, BLOCK_TYPES } from "../blocks/blockModel";
import { getTableDataRows, isLinkedTableBlock } from "../blocks/linkedTableModel";
import { buildTextDocFromString, extractTextFromNode } from "./textUtils";
import { translateTextDoc, translateTextValue } from "./translationBatch";
import { translateChartContent, translateStringMatrix } from "./translationGrid";

export async function translateBlockFromSource({
  translationService,
  documentData,
  block,
  sourceLanguageId,
  targetLanguageId,
  allBlocks,
}) {
  const translateOpts = {
    translationService,
    documentData,
    sourceLanguageId,
    targetLanguageId,
  };
  const base = {
    type: block.type,
    position: { ...block.position },
    size: { ...block.size },
    pageId: block.pageId,
    languageId: targetLanguageId,
    metadata: { ...block.metadata },
  };

  if (
    block.type === "text" ||
    block.type === "heading" ||
    block.type === "title" ||
    block.type === "subtitle"
  ) {
    if (block.content && typeof block.content === "object") {
      const translatedDoc = await translateTextDoc({
        translationService,
        documentData,
        content: block.content,
        sourceLanguageId,
        targetLanguageId,
      });
      return createBlock({
        ...base,
        content: translatedDoc,
      });
    }

    const rawText = extractTextFromNode(block.content).trim();
    const translated = await translateTextValue({
      translationService,
      documentData,
      text: rawText,
      sourceLanguageId,
      targetLanguageId,
    });
    return createBlock({
      ...base,
      content: buildTextDocFromString(translated),
    });
  }

  if (block.type === "table" || block.type === "linkedTable") {
    const rows = getTableDataRows(block);
    const translatedRows = await translateStringMatrix(rows, translateOpts);
    const content = { ...(block.content || {}) };
    if (isLinkedTableBlock(block)) {
      content.dataSourceRows = translatedRows;
      delete content.rows;
    } else {
      content.rows = translatedRows;
    }
    return createBlock({
      ...base,
      content,
    });
  }

  if (block.type === BLOCK_TYPES.CHART) {
    const content = await translateChartContent(block.content, {
      ...translateOpts,
      allBlocks,
    });
    return createBlock({
      ...base,
      content,
    });
  }

  return createBlock({
    ...base,
    content: block.content ? JSON.parse(JSON.stringify(block.content)) : null,
  });
}
