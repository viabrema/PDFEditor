import { extractTextFromNode } from "./textUtils.js";

export function isAnalysisInstruction(instruction) {
  return /(analise|analisar|resuma|resumir|interprete|interpretar|inspecione|inspecionar)/i.test(
    instruction
  );
}

export function isFormattingInstruction(instruction) {
  return /(formatacao|formatação|fonte|tamanho|negrito|italico|it[aá]lico|sublinhado|alinhamento|alinhar|centralizar|titulo|subtitulo|paragrafo)/i.test(
    instruction
  );
}

export function buildAiPrompt({ block, instruction, mode }) {
  if (block.type === "table") {
    const rows = Array.isArray(block.content?.rows) ? block.content.rows : [];
    if (mode === "analysis") {
      return [
        "Voce e um assistente que analisa tabelas.",
        "Retorne apenas o texto da analise, sem blocos de codigo.",
        "Tabela (JSON):",
        JSON.stringify(rows),
        "Instrucao:",
        instruction,
      ].join("\n");
    }
    return [
      "Voce e um assistente que edita tabelas.",
      "Retorne apenas um JSON array de arrays com o mesmo formato.",
      "Tabela (JSON):",
      JSON.stringify(rows),
      "Instrucao:",
      instruction,
    ].join("\n");
  }

  const currentText = extractTextFromNode(block.content).trim();
  if (mode === "analysis") {
    return [
      "Voce e um assistente que analisa texto.",
      "Retorne apenas o texto da analise, sem blocos de codigo.",
      "Texto atual:",
      currentText,
      "Instrucao:",
      instruction,
    ].join("\n");
  }
  if (mode === "format") {
    return [
      "Voce e um assistente que ajusta formatacao de texto.",
      "Retorne apenas JSON com a resposta.",
      "Formato: {\"contentText\":string?,\"textStyle\":{\"fontSize\":string?,\"fontFamily\":string?,\"bold\":boolean?,\"italic\":boolean?},\"blockFormat\":{\"type\":\"paragraph\"|\"heading\",\"level\"?:1|2,\"textAlign\"?:\"left\"|\"center\"|\"right\"}}",
      "Se nao precisar mudar texto, omita contentText.",
      "Texto atual:",
      currentText,
      "Instrucao:",
      instruction,
    ].join("\n");
  }
  return [
    "Voce e um assistente que edita texto.",
    "Retorne apenas o texto atualizado, sem aspas.",
    "Texto atual:",
    currentText,
    "Instrucao:",
    instruction,
  ].join("\n");
}

export function buildPageAiPrompt({ pageBlocks, instruction, mode }) {
  if (mode === "analysis") {
    return [
      "Voce e um assistente que analisa uma pagina com blocos.",
      "Retorne apenas o texto da analise, sem blocos de codigo.",
      "Pagina (JSON):",
      JSON.stringify(pageBlocks),
      "Instrucao:",
      instruction,
    ].join("\n");
  }

  return [
    "Voce e um assistente que edita uma pagina com blocos.",
    "Retorne apenas JSON com a lista de acoes.",
    "Formato: {\"actions\":[...]}.",
    "Tipos suportados: update, create, delete.",
    "update: {type:'update', id, contentText?, tableRows?, position?, size?}",
    "create: {type:'create', blockType:'text'|'table', contentText?, tableRows?, position?, size?}",
    "tableRows deve ser array de arrays (linhas com celulas).",
    "delete: {type:'delete', id}",
    "Pagina (JSON):",
    JSON.stringify(pageBlocks),
    "Instrucao:",
    instruction,
  ].join("\n");
}
