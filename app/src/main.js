import "./style.css";
import { createAiService } from "./services/ai.js";
import { createTranslationService } from "./services/translation.js";
import { renderAppTemplate } from "./app/appTemplate.js";
import { getTranslationEndpoint, TRANSLATION_KEY } from "./app/config.js";
import { bindEvents } from "./app/events.js";
import { createAiFlow } from "./app/aiFlow.js";
import { createRenderer } from "./app/render.js";
import { getDomRefs } from "./app/refs.js";
import { createInitialBlocks, createInitialDocument, createInitialState, stateFile } from "./app/state.js";
import { translateFromDefaultLanguage } from "./app/translationFlow.js";

const app = document.querySelector("#app");
renderAppTemplate(app);

const refs = getDomRefs();
const documentData = createInitialDocument();
const state = createInitialState(documentData);
const blocks = createInitialBlocks();

const endpoint = getTranslationEndpoint();
const translationService = createTranslationService({
  endpoint,
  apiKey: TRANSLATION_KEY,
});
const aiService = createAiService({ endpoint, apiKey: TRANSLATION_KEY });

const aiFlow = createAiFlow({ blocks, state });

let renderer;
const translateHandler = (targetLanguageId) =>
  translateFromDefaultLanguage({
    translationService,
    documentData,
    state,
    blocks,
    render: () => renderer.render(),
    targetLanguageId,
  });

renderer = createRenderer({
  documentData,
  state,
  blocks,
  refs,
  translateFromDefaultLanguage: translateHandler,
  aiFlow,
});

bindEvents({
  documentData,
  state,
  blocks,
  refs,
  stateFile,
  renderer,
  aiFlow,
  translationService,
  aiService,
});

renderer.render();
