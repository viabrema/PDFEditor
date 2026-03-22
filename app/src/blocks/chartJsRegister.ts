import { Chart, registerables } from "chart.js";
import {
  CandlestickController,
  CandlestickElement,
  OhlcController,
  OhlcElement,
} from "chartjs-chart-financial";

let didRegister = false;

/** Registo único de Chart.js + plugin financeiro (velas/OHLC). */
export function registerChartJs(): void {
  if (didRegister) {
    return;
  }
  didRegister = true;
  Chart.register(
    ...registerables,
    CandlestickController,
    CandlestickElement,
    OhlcController,
    OhlcElement,
  );
}

export { Chart };
