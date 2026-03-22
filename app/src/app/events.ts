import { bindAiEvents } from "./events/aiEvents";
import { bindBlockEvents } from "./events/blockEvents";
import { bindFileEvents } from "./events/fileEvents";
import { bindHistoryEvents } from "./events/historyEvents";
import { bindLinkedTableEvents } from "./events/linkedTableEvents";
import { bindMiscEvents } from "./events/miscEvents";
import { bindPageEvents } from "./events/pageEvents";
import { bindUiEvents } from "./events/uiEvents";
import { bindChartModal } from "./chartModal";

export function bindEvents({
  documentData,
  state,
  blocks,
  refs,
  stateFile,
  renderer,
  aiFlow,
  translationService,
  aiService,
  linkedTableBridge,
  linkedChartBridge,
  documentHistory,
}) {
  bindHistoryEvents({ refs, state, documentHistory, renderer });
  bindUiEvents({ documentData, state, refs, renderer, documentHistory });
  bindPageEvents({ documentData, state, blocks, refs, renderer, documentHistory });
  bindBlockEvents({ documentData, state, blocks, refs, renderer, documentHistory });
  bindChartModal({ refs, blocks, documentData, state, renderer, documentHistory });
  bindLinkedTableEvents({
    documentData,
    state,
    blocks,
    refs,
    renderer,
    linkedTableBridge,
    linkedChartBridge,
    documentHistory,
  });
  bindFileEvents({
    documentData,
    state,
    blocks,
    refs,
    stateFile,
    renderer,
    documentHistory,
  });
  bindAiEvents({ state, refs, renderer, aiFlow, aiService });
  bindMiscEvents({ state, blocks, renderer, documentHistory });
}
