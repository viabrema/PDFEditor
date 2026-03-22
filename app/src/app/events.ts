import { bindAiEvents } from "./events/aiEvents";
import { bindBlockEvents } from "./events/blockEvents";
import { bindFileEvents } from "./events/fileEvents";
import { bindMiscEvents } from "./events/miscEvents";
import { bindUiEvents } from "./events/uiEvents";

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
}) {
  bindUiEvents({ documentData, state, refs, renderer });
  bindBlockEvents({ documentData, state, blocks, refs, renderer });
  bindFileEvents({ documentData, state, blocks, refs, stateFile, renderer });
  bindAiEvents({ state, refs, renderer, aiFlow, aiService });
  bindMiscEvents({ state, blocks, renderer });

}
