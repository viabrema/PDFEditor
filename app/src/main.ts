import "./style.css";
import { createAiService } from "./services/ai";
import { createTranslationService } from "./services/translation";
import { renderAppTemplate } from "./app/appTemplate";
import { getTranslationEndpoint, TRANSLATION_KEY } from "./app/config";
import { createTauriHubFetcher } from "./services/tauriHubFetch";
import { bindEvents } from "./app/events";
import { createAiFlow } from "./app/aiFlow";
import { createRenderer } from "./app/render";
import { getDomRefs } from "./app/refs";
import { createDocumentHistory } from "./app/documentHistory";
import { createInitialBlocks, createInitialDocument, createInitialState, stateFile } from "./app/state";
import { translateFromDefaultLanguage } from "./app/translationFlow";

const app = document.querySelector("#app");
renderAppTemplate(app);

const refs = getDomRefs();
const documentData = createInitialDocument();
const state = createInitialState(documentData);
const blocks = createInitialBlocks();

const endpoint = getTranslationEndpoint();
const hubFetch = createTauriHubFetcher();
const translationService = createTranslationService({
  endpoint,
  apiKey: TRANSLATION_KEY,
  fetcher: hubFetch || undefined,
});
const aiService = createAiService({
  endpoint,
  apiKey: TRANSLATION_KEY,
  fetcher: hubFetch || undefined,
});

const documentHistory = createDocumentHistory({
  documentData,
  blocks,
  state,
});

const aiFlow = createAiFlow({ blocks, state, documentData, documentHistory });

const linkedTableBridge: { reconfigure?: (block: any) => Promise<void> } = {};
const linkedChartBridge: { reconfigure?: (block: any) => Promise<void> } = {};

const renderContext: { renderer: ReturnType<typeof createRenderer> | null } = {
  renderer: null,
};

const translateHandler = (targetLanguageId) =>
  translateFromDefaultLanguage({
    translationService,
    documentData,
    state,
    blocks,
    render: () => renderContext.renderer?.render(),
    targetLanguageId,
  });

renderContext.renderer = createRenderer({
  documentData,
  state,
  blocks,
  refs,
  translateFromDefaultLanguage: translateHandler,
  aiFlow,
  linkedTableBridge,
  linkedChartBridge,
  documentHistory,
});

bindEvents({
  documentData,
  state,
  blocks,
  refs,
  stateFile,
  renderer: renderContext.renderer,
  aiFlow,
  translationService,
  aiService,
  linkedTableBridge,
  linkedChartBridge,
  documentHistory,
});

renderContext.renderer.render();
