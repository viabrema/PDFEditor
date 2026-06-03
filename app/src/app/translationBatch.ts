import { getLanguagePromptLabel } from "./translationLanguage";

const TRANSLATE_BATCH_CHUNK_SIZE = 40;

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

async function translateTextBatchChunk({
  translationService,
  documentData,
  texts,
  sourceLanguageId,
  targetLanguageId,
}: {
  translationService: any;
  documentData: any;
  texts: string[];
  sourceLanguageId: string;
  targetLanguageId: string;
}): Promise<string[]> {
  const normalized = texts.map((text) => String(text || ""));
  if (normalized.every((text) => !text.trim())) {
    return normalized;
  }

  const prompt = [
    `Traduza do ${getLanguagePromptLabel(documentData, sourceLanguageId)} para ${getLanguagePromptLabel(
      documentData,
      targetLanguageId
    )}.`,
    "Retorne apenas um JSON array de strings na mesma ordem e com o mesmo numero de elementos.",
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
    if (Array.isArray(parsed)) {
      return normalized.map((orig, i) => {
        const v = parsed[i];
        if (typeof v === "string") {
          return v;
        }
        return v != null ? String(v) : orig;
      });
    }
  } catch {
    return normalized;
  }

  return normalized;
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

  const out: string[] = [];
  for (let i = 0; i < normalized.length; i += TRANSLATE_BATCH_CHUNK_SIZE) {
    const slice = normalized.slice(i, i + TRANSLATE_BATCH_CHUNK_SIZE);
    const part = await translateTextBatchChunk({
      translationService,
      documentData,
      texts: slice,
      sourceLanguageId,
      targetLanguageId,
    });
    out.push(...part);
  }
  return out;
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
