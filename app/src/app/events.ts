import { bindAiEvents } from "./events/aiEvents";
import { bindBlockEvents } from "./events/blockEvents";
import { bindFileEvents } from "./events/fileEvents";
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
}) {
  bindUiEvents({ documentData, state, refs, renderer });
  bindPageEvents({ documentData, state, blocks, refs, renderer });
  bindBlockEvents({ documentData, state, blocks, refs, renderer });
  bindChartModal({ refs, blocks, documentData, state, renderer });
  bindLinkedTableEvents({
    documentData,
    state,
    blocks,
    refs,
    renderer,
    linkedTableBridge,
  });
  bindFileEvents({ documentData, state, blocks, refs, stateFile, renderer });
  bindAiEvents({ state, refs, renderer, aiFlow, aiService });
  bindMiscEvents({ state, blocks, renderer });

}
