export function getDefaultLanguageId(documentData) {
  const defaultLanguage = documentData.languages.find((lang) => lang.isDefault);
  return defaultLanguage?.id || documentData.languages[0]?.id || null;
}

/** Idioma efetivo para filtro UI: blocos sem languageId contam como idioma por defeito. */
export function effectiveBlockLanguageId(block: { languageId?: string | null }, documentData: any) {
  if (block.languageId != null && block.languageId !== "") {
    return block.languageId;
  }
  return getDefaultLanguageId(documentData);
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
