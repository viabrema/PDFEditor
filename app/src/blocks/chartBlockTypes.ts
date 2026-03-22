export const CHART_SPEC_VERSION = 1;

/** Tipos base suportados no editor (mistos via dataset.type). */
export type ChartBaseType =
  | "line"
  | "bar"
  | "pie"
  | "doughnut"
  | "radar"
  | "polarArea"
  | "scatter"
  | "bubble"
  | "candlestick";

export type ChartDatasetTypeOverride =
  | "line"
  | "bar"
  | "pie"
  | "doughnut"
  | "radar"
  | "polarArea"
  | "scatter"
  | "bubble"
  | "candlestick";

export type ChartDatasetMapping = {
  /** Índice da coluna (0-based) para rótulos do eixo X / categorias. */
  xColumnIndex: number;
  /** Índice da coluna para valores Y (line, bar, scatter). */
  yColumnIndex: number;
  /** Candlestick: colunas OHLC (opcional se não for candlestick). */
  openColumnIndex?: number;
  highColumnIndex?: number;
  lowColumnIndex?: number;
  closeColumnIndex?: number;
  /** Bubble: raio (tamanho). */
  rColumnIndex?: number;
};

export type ChartDatasetStyle = {
  borderColor?: string;
  backgroundColor?: string;
  fill?: boolean;
  tension?: number;
  borderWidth?: number;
  pointRadius?: number;
};

export type ChartDatasetSpec = {
  id: string;
  label: string;
  /** Para gráfico misto: tipo deste dataset (ex.: bar sobre line). */
  type?: ChartDatasetTypeOverride;
  mapping: ChartDatasetMapping;
  style?: ChartDatasetStyle;
};

export type ChartTitleSpec = {
  text?: string;
  backgroundColor?: string;
  color?: string;
};

export type ChartSpec = {
  version: number;
  baseType: ChartBaseType;
  title?: ChartTitleSpec;
  legendDisplay?: boolean;
  legendPosition?: "top" | "bottom" | "left" | "right";
  /** Eixo Y à direita (cartesianos). */
  yAxisRight?: boolean;
  datasets: ChartDatasetSpec[];
};

export type ChartBlockContent = {
  configured: boolean;
  /** Grelha editável no modal (fonte de dados do gráfico; não usa blocos na área de trabalho). */
  dataSourceRows: string[][];
  firstRowIsHeader: boolean;
  chart: ChartSpec;
  previewDataUrl?: string;
  /** Legado: documentos antigos; `resolveChartTableData` pode ler da tabela até migrar. */
  dataSourceBlockId?: string | null;
};

export function defaultChartSpec(): ChartSpec {
  return {
    version: CHART_SPEC_VERSION,
    baseType: "line",
    title: { text: "" },
    legendDisplay: true,
    legendPosition: "top",
    yAxisRight: false,
    datasets: [
      {
        id: "ds-1",
        label: "Serie 1",
        mapping: { xColumnIndex: 0, yColumnIndex: 1 },
        style: {
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.15)",
          fill: false,
          tension: 0.2,
        },
      },
    ],
  };
}

export function emptyChartContent(): ChartBlockContent {
  return {
    configured: false,
    dataSourceRows: [
      ["A", "B"],
      ["", ""],
    ],
    firstRowIsHeader: true,
    chart: defaultChartSpec(),
  };
}
