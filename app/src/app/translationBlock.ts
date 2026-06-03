import { createBlock } from "../blocks/blockModel";
import { buildTextDocFromString, extractTextFromNode } from "./textUtils";
import {
  translateTextBatch,
  translateTextDoc,
  translateTextValue,
} from "./translationBatch";

export async function translateBlockFromSource({
  translationService,
  documentData,
  block,
  sourceLanguageId,
  targetLanguageId,
}) {
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
    const rows = Array.isArray(block.content?.rows) ? block.content.rows : [];
    const flatCells = rows.flatMap((row) => row.map((cell) => String(cell || "")));
    const translatedCells = await translateTextBatch({
      translationService,
      documentData,
      texts: flatCells,
      sourceLanguageId,
      targetLanguageId,
    });
    let cellIndex = 0;
    const translatedRows = rows.map((row) =>
      row.map(() => {
        const next = translatedCells[cellIndex] ?? "";
        cellIndex += 1;
        return next;
      })
    );
    return createBlock({
      ...base,
      content: { ...(block.content || {}), rows: translatedRows },
    });
  }

  return createBlock({
    ...base,
    content: block.content ? JSON.parse(JSON.stringify(block.content)) : null,
  });
}
