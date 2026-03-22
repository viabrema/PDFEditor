import { createBlock } from "../blocks/blockModel";
import { buildTextDocFromString, extractTextFromNode } from "./textUtils";

export function getDefaultLanguageId(documentData) {
  const defaultLanguage = documentData.languages.find((lang) => lang.isDefault);
  return defaultLanguage?.id || documentData.languages[0]?.id || null;
}

export function getLanguagePromptLabel(documentData, languageId) {
  const language = documentData.languages.find((item) => item.id === languageId);
  if (!language) {
    return "ingles";
  }
  if (language.label === "PT") {
    return "portugues";
  }
  if (language.label === "ES") {
    return "espanhol";
  }
  if (language.label === "ZH") {
    return "chines simplificado";
  }
  return "ingles";
}

export async function translateTextValue({
  translationService,
  documentData,
  text,
  sourceLanguageId,
  targetLanguageId,
}) {
  if (!text || !text.trim()) {
    return text;
  }
  const result = await translationService.translateText({
    text,
    sourceLang: getLanguagePromptLabel(documentData, sourceLanguageId),
    targetLang: getLanguagePromptLabel(documentData, targetLanguageId),
  });
  if (!result.ok) {
    throw new Error("translation_failed");
  }
  return result.text || text;
}

export async function translateTextBatch({
  translationService,
  documentData,
  texts,
  sourceLanguageId,
  targetLanguageId,
}) {
  const normalized = texts.map((text) => String(text || ""));
  if (normalized.every((text) => !text.trim())) {
    return normalized;
  }

  const prompt = [
    `Traduza do ${getLanguagePromptLabel(documentData, sourceLanguageId)} para ${getLanguagePromptLabel(
      documentData,
      targetLanguageId
    )}.`,
    "Retorne apenas um JSON array de strings na mesma ordem.",
    "Texto (JSON array):",
    JSON.stringify(normalized),
  ].join("\n");

  const result = await translationService.translatePrompt({ prompt });
  if (!result.ok || !result.text) {
    return normalized;
  }

  try {
    const cleaned = result.text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.length === normalized.length) {
      return parsed.map((value) => String(value));
    }
  } catch (error) {
    return normalized;
  }

  return normalized;
}

export async function translateTextDoc({
  translationService,
  documentData,
  content,
  sourceLanguageId,
  targetLanguageId,
}) {
  const texts = [];

  function collectTextNodes(node) {
    if (!node || typeof node !== "object") {
      return;
    }
    if (node.type === "text") {
      texts.push(node.text || "");
      return;
    }
    if (!Array.isArray(node.content)) {
      return;
    }
    node.content.forEach(collectTextNodes);
  }

  collectTextNodes(content);

  if (texts.length === 0) {
    return content;
  }

  const translatedTexts = await translateTextBatch({
    translationService,
    documentData,
    texts,
    sourceLanguageId,
    targetLanguageId,
  });

  let index = 0;
  function applyTexts(node) {
    if (!node || typeof node !== "object") {
      return node;
    }
    if (node.type === "text") {
      const nextText = translatedTexts[index] ?? node.text;
      index += 1;
      return { ...node, text: nextText };
    }
    if (!Array.isArray(node.content)) {
      return { ...node };
    }
    return {
      ...node,
      content: node.content.map(applyTexts),
    };
  }

  return applyTexts(content);
}

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
      content: { rows: translatedRows },
    });
  }

  return createBlock({
    ...base,
    content: block.content ? JSON.parse(JSON.stringify(block.content)) : null,
  });
}

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
    const sourceBlocks = blocks.filter(
      (block) => block.languageId === sourceLanguageId || !block.languageId
    );
    const translatedBlocks = [];
    for (const block of sourceBlocks) {
      translatedBlocks.push(
        await translateBlockFromSource({
          translationService,
          documentData,
          block,
          sourceLanguageId,
          targetLanguageId,
        })
      );
    }

    const remaining = blocks.filter((block) => block.languageId !== targetLanguageId);
    blocks.length = 0;
    blocks.push(...remaining, ...translatedBlocks);
  } catch (error) {
    state.translation.error = "Falha ao traduzir.";
  } finally {
    state.translation.loading = false;
    render();
  }
}
