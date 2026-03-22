/** Tipos de bloco que a IA pode criar via JSON de acoes (extensível). */
export const AI_CREATABLE_BLOCK_TYPES = [
  "text",
  "heading",
  "table",
  "image",
] as const;

export type AiCreatableBlockType = (typeof AI_CREATABLE_BLOCK_TYPES)[number];

export function isAnalysisInstruction(instruction: string) {
  return /(analise|analisar|resuma|resumir|interprete|interpretar|inspecione|inspecionar)/i.test(
    instruction,
  );
}

export function isFormattingInstruction(instruction: string) {
  return /(formatacao|formatação|fonte|tamanho|negrito|italico|it[aá]lico|sublinhado|alinhamento|alinhar|centralizar|titulo|subtitulo|paragrafo)/i.test(
    instruction,
  );
}

function actionSchemaLines(options: { formatMode: boolean; pageSizeLine: string; gridLine: string }) {
  const { formatMode, pageSizeLine, gridLine } = options;
  const lines = [
    "Voce edita o documento via JSON. Retorne apenas JSON valido.",
    'Formato obrigatorio: {"actions":[...]}.',
    "Tipos de acao: update, create, delete.",
    "update: {type:'update', id, contentText?, tableRows?, content?, position?, size?, pageId?}",
    "  Para tabelas: tableRows OU content (array de arrays; uma celula = string).",
    "  pageId: so necessario se estiver a mover o bloco para outra pagina (mesmo idioma).",
    "create: {type:'create', blockType, pageId?, region?, headingLevel?, contentText?, tableRows?, content?, imageSrc?, position?, size?}",
    `  blockType permitido para criar: ${AI_CREATABLE_BLOCK_TYPES.map((t) => `'${t}'`).join(", ")}.`,
    "  pageId: omita para usar a pagina ativa do utilizador.",
    "  region: 'body' (padrao), 'header' ou 'footer' quando fizer sentido.",
    "  imageSrc: URL ou data URL para blocos image.",
    "  Tabelas linkadas ao Excel nao podem ser criadas por aqui; use a interface da app.",
    "delete: {type:'delete', id}",
    "position e size: numeros em pixels, inteiros quando possivel. Sem percentagem ou 'auto'.",
    pageSizeLine,
    gridLine,
  ];
  if (formatMode) {
    lines.splice(
      6,
      0,
      "  Para blocos text ou heading, update pode incluir textStyle e blockFormat (opcional):",
      '  textStyle: { fontSize?, fontFamily?, bold?, italic? }',
      '  blockFormat: { type: "paragraph"|"heading", level?:1|2, textAlign?: "left"|"center"|"right" }',
      "  textAlign pode ir em blockFormat; fonte/tamanho em textStyle aplicam ao bloco inteiro.",
      "  Listas em contentText: markdown simples (- item, 1. item).",
    );
  }
  return lines;
}

export type DocumentLayoutEntry = {
  id: string;
  pageId: string;
  pageIndex: number;
  pageName: string;
  region: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  summary: string;
};

export type FocusedBlockEntry = {
  focusOrder: number;
  snapshot: Record<string, unknown>;
};

export function buildDocumentAiPrompt({
  activeLanguageLabel,
  documentLayout,
  focusedBlocks,
  instruction,
  mode,
  pageSize,
  gridSize,
}: {
  activeLanguageLabel: string;
  documentLayout: DocumentLayoutEntry[];
  focusedBlocks: FocusedBlockEntry[];
  instruction: string;
  mode: "analysis" | "edit" | "format";
  pageSize: { width: number; height: number };
  gridSize: number | string | undefined;
}) {
  const pageSizeLine = `Tamanho de cada pagina (px): ${pageSize?.width ?? "?"} x ${pageSize?.height ?? "?"}`;
  const gridLine = `Grid (px): ${gridSize ?? "?"}`;

  if (mode === "analysis") {
    return [
      "Voce e um assistente que analisa um documento com varias paginas e blocos.",
      `Idioma ativo na UI: ${activeLanguageLabel}.`,
      "O layout lista todos os blocos desse idioma (resumo).",
      "Blocos em foco (selecionados) incluem conteudo completo; use-os quando a pergunta for sobre selecao.",
      "Retorne apenas texto de analise, sem markdown de codigo.",
      "Layout (JSON):",
      JSON.stringify(documentLayout),
      focusedBlocks.length > 0 ? "Blocos em foco — ordem de selecao (JSON):" : "Nenhum bloco em foco.",
      focusedBlocks.length > 0 ? JSON.stringify(focusedBlocks) : "",
      "Instrucao:",
      instruction,
    ]
      .filter(Boolean)
      .join("\n");
  }

  const formatMode = mode === "format";
  return [
    "Voce e um assistente que altera o documento por acoes.",
    `Idioma ativo na UI: ${activeLanguageLabel}. So deve editar blocos desse idioma (ids do layout).`,
    "O utilizador pode pedir para criar blocos, alterar qualquer bloco por id, ou referir-se aos blocos selecionados.",
    "Prioridade: instrucoes que citam 'selecionado', ordem (primeiro/segundo), ou ids explicitos.",
    "Primeiro bloco selecionado = focusOrder 1, segundo = 2, etc.",
    "Nao limite-se ao foco: use o layout para localizar qualquer bloco ou pagina.",
    "Em create, sem pageId valido no JSON: o bloco novo vai para a pagina ativa (ultima em que o utilizador clicou na area do documento).",
    ...actionSchemaLines({ formatMode, pageSizeLine, gridLine }),
    "Layout do documento — resumo por bloco (JSON):",
    JSON.stringify(documentLayout),
    focusedBlocks.length > 0
      ? "Blocos em foco — conteudo completo, ordem de selecao (JSON):"
      : "Nenhum bloco selecionado; todas as alteracoes devem usar ids do layout ou criar na pagina ativa.",
    focusedBlocks.length > 0 ? JSON.stringify(focusedBlocks) : "",
    "Instrucao:",
    instruction,
  ]
    .filter(Boolean)
    .join("\n");
}
