/** Tipos de bloco que a IA pode criar via JSON de acoes (extensível). */
export const AI_CREATABLE_BLOCK_TYPES = [
  "text",
  "heading",
  "table",
  "image",
  "chart",
] as const;

export type AiCreatableBlockType = (typeof AI_CREATABLE_BLOCK_TYPES)[number];

/** Pedidos que alteram o documento (criar blocos, etc.) — têm prioridade sobre modo analise. */
export function isDocumentEditInstruction(instruction: string) {
  return /(cri(e|ar|ou)|adicion|inserir|novo|box|bloco|grafico|gráfico|apague|elimine|delete|remov|exclu|mova|altere|atualize|modifique|substitu)/i.test(
    instruction,
  );
}

export function isAnalysisInstruction(instruction: string) {
  if (isDocumentEditInstruction(instruction)) {
    return false;
  }
  return /(analise|analisar|resuma|resumir|interprete|interpretar|inspecione|inspecionar)/i.test(
    instruction,
  );
}

export function isFormattingInstruction(instruction: string) {
  if (/(tabela|linha|coluna|celula|célula|fundo|cor de fundo)/i.test(instruction)) {
    return false;
  }
  return /(formatacao|formatação|fonte|tamanho|negrito|italico|it[aá]lico|sublinhado|alinhamento|alinhar|centralizar|titulo|subtitulo|paragrafo)/i.test(
    instruction,
  );
}

function chartAndDataSourcePromptLines() {
  return [
    "  Tabela (create): excludeFromPdfExport?: boolean — se true, a tabela nao entra no PDF/HTML de impressao.",
    "  Grafico (create): dataSourceRows (obrigatorio): array de arrays de strings (mesmo formato que tableRows); firstRowIsHeader?: boolean (padrao true);",
    "    Opcional legado: dataSourceBlockId + id de tabela no layout se nao enviar dataSourceRows (evitar).",
    "    chart: { baseType, title?: {text, backgroundColor?, color?}, legendDisplay?, legendPosition?: 'top'|'bottom'|'left'|'right', yAxisRight?: boolean,",
    "      datasets: [{ label, type? (misto: line|bar em graficos cartesianos), mapping: { xColumnIndex, yColumnIndex, openColumnIndex?, highColumnIndex?, lowColumnIndex?, closeColumnIndex?, rColumnIndex? }, style?: { borderColor?, backgroundColor?, fill?, tension?, borderWidth?, pointRadius? } }] }",
    "    baseType: line|bar|pie|doughnut|radar|polarArea|scatter|bubble|candlestick. Indices de coluna sao 0-based (primeira coluna = 0).",
    "    candlestick: mapping precisa open, high, low, close (indices). bubble: rColumnIndex. pie/doughnut/polarArea: uma serie. Misto: so combinacoes line+bar com base cartesiana.",
    "  update em bloco chart: dataSourceRows?, tableRows?, content? (equivalente a rows), firstRowIsHeader?, chart?, configured?, position?, size?, pageId?",
    "Interpretacao de pedidos (exemplos):",
    "  'Grafico de barras com a tabela selecionada' -> copiar o array `content` do snapshot da tabela selecionada para dataSourceRows do create chart.",
    "  'Colunas data e aporte' -> cabecalho na primeira linha (firstRowIsHeader true) e indices x/y a partir dos nomes.",
    "  'Misto barras e linhas' -> baseType line ou bar + datasets[].type alternando bar/line onde permitido.",
    "  Fonte desnormalizada ou numeros em texto -> construir dataSourceRows normalizada diretamente no create chart.",
    "  Duas tabelas selecionadas -> fundir numa unica dataSourceRows (wide ou long) num so create chart.",
  ];
}

function actionSchemaLines(options: { formatMode: boolean; pageSizeLine: string; gridLine: string }) {
  const { formatMode, pageSizeLine, gridLine } = options;
  const lines = [
    "Voce edita o documento via JSON. Retorne apenas JSON valido.",
    'Formato obrigatorio: {"actions":[...]}.',
    "Tipos de acao: update, create, delete.",
    "update: {type:'update', id, contentText?, tableRows?, content?, position?, size?, pageId?, excludeFromPdfExport?, ...}",
    "  Para tabelas (dados): deleteRows:[0] remove linhas 0-based na camada de dados (linkedTable e table). Preferir a reescrever tableRows inteira.",
    "  tableRows/content (array de arrays de strings) substitui a grelha de dados quando nao ha tableFormat/rowStyles/cellStyles no mesmo update.",
    "  Exemplo excluir primeira linha: { type:'update', id, deleteRows:[0] }.",
    "  Para tabelas (visual/cor/fundo/fonte): use tableFormat ou rowStyles/cellStyles/colStyles — NAO envie tableRows com objetos {text, backgroundColor} por celula.",
    "  tableFormat ou tableFormats: um patch { scope, row?, col?, style? } OU array de patches (preferir array para varias linhas/celulas).",
    "  Exemplo institucional (linha cabecalho + zebra): tableFormat:[{scope:'row',row:0,style:{backgroundColor:'#f0f0f0',fontWeight:'bold'}},{scope:'row',row:1,style:{backgroundColor:'#d9edf7'}}].",
    "  Exemplo fundo vermelho na linha 0: { type:'update', id, tableFormat:{ scope:'row', row:0, style:{ backgroundColor:'#FF0000' } } }.",
    "  rowStyles: { '0': { backgroundColor:'#foo' } }; cellStyles: { '0,1': { color:'#fff' } } (chaves row = indice linha; cell = 'linha,coluna' 0-based).",
    "  linkedTable: cores/fontes = camada visual; deleteRows ou tableRows (so strings) = camada de dados (dataSourceRows).",
    "  excludeFromPdfExport?: boolean aplica-se a table/linkedTable.",
    "  Para blocos chart: dataSourceRows?, tableRows?, content? (rows), dataSourceBlockId? (legado), firstRowIsHeader?, chart?, configured?",
    "  pageId: so necessario se estiver a mover o bloco para outra pagina (mesmo idioma).",
    "create: {type:'create', blockType, pageId?, region?, headingLevel?, contentText?, tableRows?, content?, imageSrc?, position?, size?, excludeFromPdfExport?, dataSourceRows?, firstRowIsHeader?, chart?}",
    `  blockType permitido para criar: ${AI_CREATABLE_BLOCK_TYPES.map((t) => `'${t}'`).join(", ")}.`,
    "  Para blockType text ou heading: contentText e OBRIGATORIO (use string vazia \"\" para caixa vazia).",
    "  Para resumir tabela selecionada num novo texto: create text com contentText = resumo; copie dados do snapshot content da tabela em foco.",
    "  pageId: omita para usar a pagina ativa do utilizador.",
    "  region: 'body' (padrao), 'header' ou 'footer' quando fizer sentido.",
    "  imageSrc: URL ou data URL para blocos image.",
    "  Tabelas linkadas ao Excel nao podem ser criadas por aqui; use a interface da app.",
    ...chartAndDataSourcePromptLines(),
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
    "Se o utilizador pedir criar caixa/bloco com resumo de tabela selecionada: modo edicao — JSON com create text e contentText preenchido (nao apenas analise em texto livre).",
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
