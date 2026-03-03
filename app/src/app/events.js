import { bindAiEvents } from "./events/aiEvents.js";
import { bindBlockEvents } from "./events/blockEvents.js";
import { bindFileEvents } from "./events/fileEvents.js";
import { bindMiscEvents } from "./events/miscEvents.js";
import { bindUiEvents } from "./events/uiEvents.js";

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
