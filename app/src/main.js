import "./style.css";
import { createBlock } from "./blocks/blockModel.js";
import { createBlockElement } from "./blocks/blockRenderer.js";
import { setupDragResize } from "./blocks/dragResize.js";
import { createImageBlockFromFile } from "./blocks/imageBlock.js";
import { createTableBlockFromRows, createTableBlockFromText, parseTabularText } from "./blocks/tableBlock.js";
import {
  createDocument,
  createLanguage,
  createPage,
} from "./editor/documentModel.js";
import { createEditor, createEditorCommands } from "./editor/editor.js";
import { createToolbar } from "./ui/toolbar.js";
import { normalizeGridSize } from "./utils/grid.js";
import { createIcons, icons } from "lucide";
import { loadDocumentFromFile, saveDocumentToFile } from "./services/tauriStorage.js";
import { renderDocumentToHtml } from "./services/export.js";
import { createTranslationService } from "./services/translation.js";

const app = document.querySelector("#app");
app.innerHTML = `
  <main class="min-h-screen bg-slate-50 text-slate-900">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div>
          <h1 class="text-2xl font-semibold">PDF Editor</h1>
          <p class="text-sm text-slate-600">Editor em modo rascunho</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            id="open-doc"
            type="button"
            class="icon-button rounded-md border border-slate-300 bg-white text-slate-700"
            title="Abrir documento"
            aria-label="Abrir documento"
          >
            <i data-lucide="folder-open"></i>
          </button>
          <button
            id="save-doc"
            type="button"
            class="icon-button rounded-md bg-slate-900 text-white"
            title="Salvar documento"
            aria-label="Salvar documento"
          >
            <i data-lucide="save"></i>
          </button>
          <button
            id="export-pdf"
            type="button"
            class="icon-button rounded-md border border-slate-300 bg-white text-slate-700"
            title="Exportar PDF"
            aria-label="Exportar PDF"
          >
            <i data-lucide="file-down"></i>
          </button>
          <div id="doc-status" class="text-xs text-slate-500">Documento local</div>
        </div>
      </div>
    </header>
    <section class="mx-auto max-w-5xl px-6 py-6">
      <div class="mb-4 flex flex-wrap items-end gap-4">
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium uppercase tracking-wide text-slate-500" for="page-format">
            Formato
          </label>
          <select
            id="page-format"
            class="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="A4">A4</option>
            <option value="Letter">Letter</option>
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium uppercase tracking-wide text-slate-500" for="page-orientation">
            Orientacao
          </label>
          <select
            id="page-orientation"
            class="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="portrait">Retrato</option>
            <option value="landscape">Paisagem</option>
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs font-medium uppercase tracking-wide text-slate-500" for="grid-size">
            Grid
          </label>
          <input
            id="grid-size"
            type="number"
            min="4"
            max="40"
            step="1"
            class="w-24 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div class="flex items-center gap-2">
          <input id="grid-snap" type="checkbox" class="h-4 w-4" />
          <label class="text-xs font-medium uppercase tracking-wide text-slate-500" for="grid-snap">
            Snap
          </label>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-xs font-medium uppercase tracking-wide text-slate-500">Pagina ativa</span>
          <span class="text-sm text-slate-700" id="page-meta"></span>
        </div>
      </div>
      <div class="mb-3 flex flex-wrap items-center gap-3">
        <div class="text-xs font-medium uppercase tracking-wide text-slate-500">Idiomas</div>
        <div class="flex flex-wrap gap-2" id="language-tabs"></div>
        <div class="flex items-center gap-2" id="language-actions"></div>
        <div id="translation-status" class="text-xs text-slate-500"></div>
      </div>
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <div class="text-xs font-medium uppercase tracking-wide text-slate-500">Paginas</div>
        <div class="flex flex-wrap gap-2" id="page-tabs"></div>
      </div>
      <div class="mb-4 flex items-center justify-between">
        <div class="text-sm text-slate-500">Canvas</div>
        <div class="flex items-center gap-2">
          <button
            id="add-text-block"
            type="button"
            class="icon-button rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-700"
            title="Novo bloco de texto"
            aria-label="Novo bloco de texto"
          >
            <i data-lucide="type"></i>
          </button>
          <button
            id="add-table-block"
            type="button"
            class="icon-button rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-700"
            title="Novo bloco de tabela"
            aria-label="Novo bloco de tabela"
          >
            <i data-lucide="table"></i>
          </button>
          <button
            id="add-image-block"
            type="button"
            class="icon-button rounded-md bg-slate-900 px-3 py-2 text-white"
            title="Novo bloco de imagem"
            aria-label="Novo bloco de imagem"
          >
            <i data-lucide="image"></i>
          </button>
          <input id="image-input" type="file" accept="image/*" class="hidden" />
        </div>
      </div>
      <div class="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6">
        <div
          id="canvas"
          class="flex max-h-[720px] flex-col gap-6 overflow-y-auto rounded-xl bg-slate-50 p-6"
        ></div>
      </div>
    </section>
  </main>
`;

const documentData = createDocument({
  title: "Documento local",
  languages: [
    createLanguage({ id: "lang-pt", label: "PT", isDefault: true }),
    createLanguage({ id: "lang-en", label: "EN" }),
    createLanguage({ id: "lang-es", label: "ES" }),
  ],
  pages: [
    createPage({ id: "page-1", name: "Pagina 1" }),
    createPage({ id: "page-2", name: "Pagina 2" }),
  ],
});

const state = {
  activePageId: documentData.pages[0].id,
  activeLanguageId: documentData.activeLanguageId,
  views: [],
  interactions: [],
  selectedBlockId: null,
  editingBlockId: null,
  translation: {
    loading: false,
    error: null,
  },
};

const blocks = [
  createBlock({
    position: { x: 32, y: 32 },
    size: { width: 520, height: 220 },
    pageId: "page-1",
    languageId: "lang-pt",
  }),
  createBlock({
    position: { x: 32, y: 32 },
    size: { width: 520, height: 220 },
    pageId: "page-2",
    languageId: "lang-pt",
  }),
  createBlock({
    position: { x: 32, y: 32 },
    size: { width: 520, height: 220 },
    pageId: "page-1",
    languageId: "lang-en",
  }),
];

const canvas = document.querySelector("#canvas");
const pageTabsHost = document.querySelector("#page-tabs");
const languageTabsHost = document.querySelector("#language-tabs");
const languageActionsHost = document.querySelector("#language-actions");
const translationStatus = document.querySelector("#translation-status");
const pageMeta = document.querySelector("#page-meta");
const addTextButton = document.querySelector("#add-text-block");
const addTableButton = document.querySelector("#add-table-block");
const addImageButton = document.querySelector("#add-image-block");
const imageInput = document.querySelector("#image-input");
const openDocButton = document.querySelector("#open-doc");
const saveDocButton = document.querySelector("#save-doc");
const exportPdfButton = document.querySelector("#export-pdf");
const docStatus = document.querySelector("#doc-status");
const formatSelect = document.querySelector("#page-format");
const orientationSelect = document.querySelector("#page-orientation");
const gridSizeInput = document.querySelector("#grid-size");
const snapToggle = document.querySelector("#grid-snap");

const PAGE_SIZES = {
  A4: { width: 794, height: 1123 },
  Letter: { width: 816, height: 1056 },
};

const TRANSLATION_ENDPOINT =
  window.location.protocol.startsWith("http")
    ? "/api/ai/prompt"
    : "http://10.36.0.19:8080/api/ai/prompt";
const TRANSLATION_KEY = "JygheDTXbNKNwA0DKL94riGK8AqxwtpyvCr2sfoQVfY";

const translationService = createTranslationService({
  endpoint: TRANSLATION_ENDPOINT,
  apiKey: TRANSLATION_KEY,
});

const stateFile = {
  path: null,
};

function getPageSize(format, orientation) {
  const base = PAGE_SIZES[format] || PAGE_SIZES.A4;
  if (orientation === "landscape") {
    return { width: base.height, height: base.width };
  }
  return base;
}

function buildDocumentSnapshot() {
  const pages = documentData.pages.map((page) => {
    const pageBlocks = blocks.filter((block) => block.pageId === page.id);
    return {
      ...page,
      blocks: pageBlocks,
    };
  });

  return {
    ...documentData,
    pages,
    metadata: {
      ...documentData.metadata,
      updatedAt: new Date().toISOString(),
    },
  };
}

function getDefaultLanguageId() {
  const defaultLanguage = documentData.languages.find((lang) => lang.isDefault);
  return defaultLanguage?.id || documentData.languages[0]?.id || null;
}

function getLanguagePromptLabel(languageId) {
  const language = documentData.languages.find((item) => item.id === languageId);
  if (!language) {
    return "ingles";
  }
  if (language.label === "PT") {
    return "portugues";
  }
  if (language.label === "ES") {
    return "espanhol";
  }
  return "ingles";
}

function extractTextFromNode(node) {
  if (!node) {
    return "";
  }
  if (typeof node === "string") {
    return node;
  }
  if (node.type === "text") {
    return node.text || "";
  }
  if (node.type === "hard_break") {
    return "\n";
  }
  if (!Array.isArray(node.content)) {
    return "";
  }
  const content = node.content.map(extractTextFromNode).join("");
  if (node.type === "paragraph" || node.type === "list_item") {
    return `${content}\n`;
  }
  return content;
}

function buildTextDocFromString(text) {
  const trimmed = String(text || "").replace(/\r\n/g, "\n");
  const blocks = trimmed.split(/\n{2,}/g);
  const paragraphs = blocks.length ? blocks : [""];
  return {
    type: "doc",
    content: paragraphs.map((paragraph) => ({
      type: "paragraph",
      content: paragraph
        ? paragraph.split("\n").flatMap((segment, index, items) => {
            const nodes = [];
            if (segment) {
              nodes.push({ type: "text", text: segment });
            }
            if (index < items.length - 1) {
              nodes.push({ type: "hard_break" });
            }
            return nodes;
          })
        : [],
    })),
  };
}

async function translateTextValue({ text, sourceLanguageId, targetLanguageId }) {
  if (!text || !text.trim()) {
    return text;
  }
  const result = await translationService.translateText({
    text,
    sourceLang: getLanguagePromptLabel(sourceLanguageId),
    targetLang: getLanguagePromptLabel(targetLanguageId),
  });
  if (!result.ok) {
    throw new Error("translation_failed");
  }
  return result.text || text;
}

async function translateTextBatch({ texts, sourceLanguageId, targetLanguageId }) {
  const normalized = texts.map((text) => String(text || ""));
  if (normalized.every((text) => !text.trim())) {
    return normalized;
  }

  const prompt = [
    `Traduza do ${getLanguagePromptLabel(sourceLanguageId)} para ${getLanguagePromptLabel(
      targetLanguageId
    )}.`,
    "Retorne apenas um JSON array de strings na mesma ordem.",
    "Texto (JSON array):",
    JSON.stringify(normalized),
  ].join("\n");

  const result = await translationService.translatePrompt({ prompt });
  if (!result.ok || !result.text) {
    return normalized;
  }

  try {
    const cleaned = result.text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed) && parsed.length === normalized.length) {
      return parsed.map((value) => String(value));
    }
  } catch (error) {
    return normalized;
  }

  return normalized;
}

async function translateNodeTree(node, { sourceLanguageId, targetLanguageId }) {
  if (!node || typeof node !== "object") {
    return node;
  }

  if (node.type === "text") {
    const translated = await translateTextValue({
      text: node.text || "",
      sourceLanguageId,
      targetLanguageId,
    });
    return {
      ...node,
      text: translated,
    };
  }

  if (!Array.isArray(node.content)) {
    return { ...node };
  }

  const translatedContent = [];
  for (const child of node.content) {
    translatedContent.push(
      await translateNodeTree(child, { sourceLanguageId, targetLanguageId })
    );
  }

  return {
    ...node,
    content: translatedContent,
  };
}

async function translateTextDoc(content, { sourceLanguageId, targetLanguageId }) {
  const texts = [];

  function collectTextNodes(node) {
    if (!node || typeof node !== "object") {
      return;
    }
    if (node.type === "text") {
      texts.push(node.text || "");
      return;
    }
    if (!Array.isArray(node.content)) {
      return;
    }
    node.content.forEach(collectTextNodes);
  }

  collectTextNodes(content);

  if (texts.length === 0) {
    return content;
  }

  const translatedTexts = await translateTextBatch({
    texts,
    sourceLanguageId,
    targetLanguageId,
  });

  let index = 0;
  function applyTexts(node) {
    if (!node || typeof node !== "object") {
      return node;
    }
    if (node.type === "text") {
      const nextText = translatedTexts[index] ?? node.text;
      index += 1;
      return { ...node, text: nextText };
    }
    if (!Array.isArray(node.content)) {
      return { ...node };
    }
    return {
      ...node,
      content: node.content.map(applyTexts),
    };
  }

  return applyTexts(content);
}

async function translateBlockFromSource(block, { sourceLanguageId, targetLanguageId }) {
  const base = {
    type: block.type,
    position: { ...block.position },
    size: { ...block.size },
    pageId: block.pageId,
    languageId: targetLanguageId,
    metadata: { ...block.metadata },
  };

  if (block.type === "text") {
    if (block.content && typeof block.content === "object") {
      const translatedDoc = await translateTextDoc(block.content, {
        sourceLanguageId,
        targetLanguageId,
      });
      return createBlock({
        ...base,
        content: translatedDoc,
      });
    }

    const rawText = extractTextFromNode(block.content).trim();
    const translated = await translateTextValue({
      text: rawText,
      sourceLanguageId,
      targetLanguageId,
    });
    return createBlock({
      ...base,
      content: buildTextDocFromString(translated),
    });
  }

  if (block.type === "table") {
    const rows = Array.isArray(block.content?.rows) ? block.content.rows : [];
    const translatedRows = [];
    for (const row of rows) {
      const translatedRow = [];
      for (const cell of row) {
        const translated = await translateTextValue({
          text: String(cell || ""),
          sourceLanguageId,
          targetLanguageId,
        });
        translatedRow.push(translated);
      }
      translatedRows.push(translatedRow);
    }
    return createBlock({
      ...base,
      content: { rows: translatedRows },
    });
  }

  return createBlock({
    ...base,
    content: block.content ? JSON.parse(JSON.stringify(block.content)) : null,
  });
}

async function translateFromDefaultLanguage(targetLanguageId) {
  const sourceLanguageId = getDefaultLanguageId();
  if (!sourceLanguageId || !targetLanguageId) {
    return;
  }

  state.translation.loading = true;
  state.translation.error = null;
  render();

  try {
    const sourceBlocks = blocks.filter((block) => block.languageId === sourceLanguageId);
    const translatedBlocks = [];
    for (const block of sourceBlocks) {
      translatedBlocks.push(
        await translateBlockFromSource(block, { sourceLanguageId, targetLanguageId })
      );
    }

    const remaining = blocks.filter((block) => block.languageId !== targetLanguageId);
    blocks.length = 0;
    blocks.push(...remaining, ...translatedBlocks);
  } catch (error) {
    state.translation.error = "Falha ao traduzir.";
  } finally {
    state.translation.loading = false;
    render();
  }
}

function applyDocumentSnapshot(snapshot) {
  if (!snapshot) {
    return;
  }

  Object.assign(documentData, snapshot);
  blocks.length = 0;

  snapshot.pages?.forEach((page) => {
    if (!Array.isArray(page.blocks)) {
      return;
    }
    page.blocks.forEach((block) => {
      blocks.push({
        ...block,
        pageId: block.pageId || page.id,
        languageId: block.languageId || snapshot.activeLanguageId,
      });
    });
  });

  state.activePageId = documentData.pages[0]?.id || null;
  state.activeLanguageId = documentData.activeLanguageId || documentData.languages[0]?.id || null;
  state.selectedBlockId = null;
  state.editingBlockId = null;
  render();
}

async function getTauriApi() {
  const tauri = globalThis.__TAURI__;
  if (!tauri?.fs || !tauri?.dialog) {
    return null;
  }
  return { fs: tauri.fs, dialog: tauri.dialog };
}

function getNextBlockPosition({ blocksForPage, blockSize, pageSize }) {
  const padding = 32;
  const offset = 24;

  if (blocksForPage.length === 0) {
    return { x: padding, y: padding };
  }

  const maxBottom = Math.max(
    ...blocksForPage.map((block) => block.position.y + block.size.height)
  );
  let nextX = padding;
  let nextY = maxBottom + offset;

  if (nextY + blockSize.height > pageSize.height - padding) {
    nextY = padding;
    nextX = padding + offset;
  }

  return { x: nextX, y: nextY };
}

function clearViews() {
  state.views.forEach((view) => view.destroy());
  state.views = [];
}

function clearInteractions() {
  state.interactions.forEach((interaction) => interaction.destroy());
  state.interactions = [];
}

function createTabButton({ label, isActive, onClick }) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = isActive
    ? "rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white"
    : "rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600";
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function renderTabs(container, items, activeId, onSelect) {
  container.innerHTML = "";
  items.forEach((item) => {
    container.append(
      createTabButton({
        label: item.label,
        isActive: item.id === activeId,
        onClick: () => onSelect(item.id),
      })
    );
  });
}

function focusEditingBlock() {
  if (!state.editingBlockId) {
    return;
  }

  const element = document.querySelector(
    `.block-shell[data-block-id="${state.editingBlockId}"]`
  );
  if (!element) {
    return;
  }

  const prose = element.querySelector(".ProseMirror");
  if (prose) {
    prose.focus();
    return;
  }

  const cell = element.querySelector("td");
  if (cell) {
    cell.focus();
  }
}

function renderCanvas() {
  canvas.innerHTML = "";
  clearViews();
  clearInteractions();

  const activeBlocks = blocks.filter(
    (block) => block.languageId === state.activeLanguageId
  );

  documentData.pages.forEach((page) => {
    const pageWrapper = document.createElement("div");
    pageWrapper.className = "page-shell";

    const { width, height } = getPageSize(
      documentData.page.format,
      documentData.page.orientation
    );

    const pageHeader = document.createElement("div");
    pageHeader.className = "mb-2 flex items-center justify-between text-xs text-slate-500";
    pageHeader.textContent = page.name;
    pageWrapper.append(pageHeader);

    const pageSurface = document.createElement("div");
    const isActivePage = page.id === state.activePageId;
    pageSurface.className = documentData.grid.snap
      ? "page-surface grid-on"
      : "page-surface";
    if (isActivePage) {
      pageSurface.classList.add("is-active");
    }
    pageSurface.style.width = `${width}px`;
    pageSurface.style.height = `${height}px`;
    pageSurface.style.setProperty("--grid-size", `${documentData.grid.size}px`);
    pageWrapper.append(pageSurface);

    pageSurface.addEventListener("click", () => {
      if (state.activePageId !== page.id) {
        state.activePageId = page.id;
        render();
      }
    });

    const pageBlocks = activeBlocks.filter((block) => block.pageId === page.id);

    if (pageBlocks.length === 0) {
      const empty = document.createElement("div");
      empty.className = "absolute inset-0 flex items-center justify-center text-sm text-slate-300";
      empty.textContent = "Sem blocos";
      pageSurface.append(empty);
    }

    pageBlocks.forEach((block) => {
      const isSelected = block.id === state.selectedBlockId;
      const isEditing = block.id === state.editingBlockId;
      const { element, editorHost } = createBlockElement(block, {
        selected: isSelected,
        editing: isEditing,
      });
      pageSurface.append(element);

      if (isEditing && block.type === "table") {
        const toolbar = createToolbar(null, { disabled: true });
        toolbar.classList.add("block-toolbar");
        element.append(toolbar);
      }

      element.addEventListener("click", (event) => {
        event.stopPropagation();
        const nextSelected = block.id;
        const nextEditing =
          state.editingBlockId && state.editingBlockId !== block.id
            ? null
            : state.editingBlockId;
        const shouldRender =
          state.selectedBlockId !== nextSelected ||
          state.editingBlockId !== nextEditing;
        state.selectedBlockId = nextSelected;
        state.editingBlockId = nextEditing;
        if (shouldRender) {
          render();
        }
      });

      element.addEventListener("dblclick", (event) => {
        event.stopPropagation();
        if (block.type === "image") {
          return;
        }
        const shouldRender =
          state.editingBlockId !== block.id || state.selectedBlockId !== block.id;
        state.selectedBlockId = block.id;
        state.editingBlockId = block.id;
        if (shouldRender) {
          render();
        }
      });

      if (editorHost) {
        const view = createEditor({
          mount: editorHost,
          content: block.content || undefined,
          editable: () => block.id === state.editingBlockId,
          onChange: (nextState) => {
            block.content = nextState.doc.toJSON();
          },
        });
        state.views.push(view);

        if (isEditing) {
          const toolbar = createToolbar(createEditorCommands(view));
          toolbar.classList.add("block-toolbar");
          element.append(toolbar);
        }
      }

      const interaction = setupDragResize({
        element,
        block,
        gridSize: documentData.grid.size,
        snapEnabled: documentData.grid.snap,
      });
      interaction.setEnabled(!isEditing);
      state.interactions.push(interaction);
    });

    canvas.append(pageWrapper);
  });

}

function renderMeta() {
  const pageIndex = documentData.pages.findIndex(
    (page) => page.id === state.activePageId
  );
  pageMeta.textContent =
    `Pagina ${pageIndex + 1} de ${documentData.pages.length} ` +
    `(${documentData.page.format}, ${documentData.page.orientation}) ` +
    `Grid ${documentData.grid.size}px ${documentData.grid.snap ? "On" : "Off"}`;
}

function renderLanguageActions() {
  languageActionsHost.innerHTML = "";
  translationStatus.textContent = "";

  const defaultLanguageId = getDefaultLanguageId();
  if (!state.activeLanguageId || state.activeLanguageId === defaultLanguageId) {
    return;
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className =
    "inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700";
  button.innerHTML = '<i data-lucide="rotate-ccw"></i>Atualizar';
  button.disabled = state.translation.loading;
  button.addEventListener("click", () => {
    if (!state.translation.loading) {
      translateFromDefaultLanguage(state.activeLanguageId);
    }
  });
  languageActionsHost.append(button);

  if (state.translation.loading) {
    translationStatus.textContent = "Traduzindo...";
    return;
  }

  if (state.translation.error) {
    translationStatus.textContent = state.translation.error;
  }
}

function render() {
  formatSelect.value = documentData.page.format;
  orientationSelect.value = documentData.page.orientation;
  gridSizeInput.value = documentData.grid.size;
  snapToggle.checked = documentData.grid.snap;

  renderTabs(
    pageTabsHost,
    documentData.pages.map((page) => ({ id: page.id, label: page.name })),
    state.activePageId,
    (id) => {
      state.activePageId = id;
      render();
    }
  );

  renderTabs(
    languageTabsHost,
    documentData.languages.map((language) => ({
      id: language.id,
      label: language.label,
    })),
    state.activeLanguageId,
    (id) => {
      state.activeLanguageId = id;
      state.selectedBlockId = null;
      state.editingBlockId = null;
      render();
    }
  );

  renderCanvas();
  renderMeta();
  renderLanguageActions();
  focusEditingBlock();
  createIcons({ icons });
}

formatSelect.value = documentData.page.format;
orientationSelect.value = documentData.page.orientation;
gridSizeInput.value = documentData.grid.size;
snapToggle.checked = documentData.grid.snap;

formatSelect.addEventListener("change", (event) => {
  documentData.page.format = event.target.value;
  renderMeta();
});

orientationSelect.addEventListener("change", (event) => {
  documentData.page.orientation = event.target.value;
  renderMeta();
});

gridSizeInput.addEventListener("change", (event) => {
  documentData.grid.size = normalizeGridSize(event.target.value, 8);
  renderCanvas();
  renderMeta();
});

snapToggle.addEventListener("change", (event) => {
  documentData.grid.snap = event.target.checked;
  renderCanvas();
  renderMeta();
});

addTextButton.addEventListener("click", () => {
  const blocksForPage = blocks.filter(
    (block) =>
      block.pageId === state.activePageId &&
      block.languageId === state.activeLanguageId
  );
  const pageSize = getPageSize(
    documentData.page.format,
    documentData.page.orientation
  );
  const blockSize = { width: 520, height: 220 };
  const position = getNextBlockPosition({
    blocksForPage,
    blockSize,
    pageSize,
  });

  const nextBlock = createBlock({
    position,
    size: blockSize,
    pageId: state.activePageId,
    languageId: state.activeLanguageId,
  });

  blocks.push(nextBlock);
  renderCanvas();
});

addTableButton.addEventListener("click", () => {
  const blocksForPage = blocks.filter(
    (block) =>
      block.pageId === state.activePageId &&
      block.languageId === state.activeLanguageId
  );
  const pageSize = getPageSize(
    documentData.page.format,
    documentData.page.orientation
  );
  const position = getNextBlockPosition({
    blocksForPage,
    blockSize: { width: 520, height: 220 },
    pageSize,
  });

  const tableBlock = createTableBlockFromRows([
    ["", ""],
    ["", ""],
  ], {
    pageId: state.activePageId,
    languageId: state.activeLanguageId,
    position,
    pageSize,
  });

  blocks.push(tableBlock);
  renderCanvas();
});

addImageButton.addEventListener("click", () => {
  imageInput.click();
});

imageInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  const blocksForPage = blocks.filter(
    (block) =>
      block.pageId === state.activePageId &&
      block.languageId === state.activeLanguageId
  );
  const pageSize = getPageSize(
    documentData.page.format,
    documentData.page.orientation
  );
  const position = getNextBlockPosition({
    blocksForPage,
    blockSize: { width: 520, height: 360 },
    pageSize,
  });

  const block = await createImageBlockFromFile(file, {
    pageId: state.activePageId,
    languageId: state.activeLanguageId,
    position,
    pageSize,
  });

  blocks.push(block);
  renderCanvas();
  imageInput.value = "";
});

document.addEventListener("paste", async (event) => {
  const items = Array.from(event.clipboardData?.items || []);
  const imageItem = items.find((item) => item.type.startsWith("image/"));
  if (!imageItem) {
    const text = event.clipboardData?.getData("text/plain") || "";
    const rows = parseTabularText(text);
    if (rows.length === 0 || rows.every((row) => row.length <= 1)) {
      return;
    }

    event.preventDefault();

    const blocksForPage = blocks.filter(
      (block) =>
        block.pageId === state.activePageId &&
        block.languageId === state.activeLanguageId
    );
    const pageSize = getPageSize(
      documentData.page.format,
      documentData.page.orientation
    );
    const position = getNextBlockPosition({
      blocksForPage,
      blockSize: { width: 520, height: 220 },
      pageSize,
    });

    const tableBlock = createTableBlockFromText(text, {
      pageId: state.activePageId,
      languageId: state.activeLanguageId,
      position,
      pageSize,
    });

    blocks.push(tableBlock);
    renderCanvas();
    return;
  }

  const file = imageItem.getAsFile();
  if (!file) {
    return;
  }

  event.preventDefault();

  const blocksForPage = blocks.filter(
    (block) =>
      block.pageId === state.activePageId &&
      block.languageId === state.activeLanguageId
  );
  const pageSize = getPageSize(
    documentData.page.format,
    documentData.page.orientation
  );
  const position = getNextBlockPosition({
    blocksForPage,
    blockSize: { width: 520, height: 360 },
    pageSize,
  });

  const block = await createImageBlockFromFile(file, {
    pageId: state.activePageId,
    languageId: state.activeLanguageId,
    position,
    pageSize,
  });

  blocks.push(block);
  renderCanvas();
});

openDocButton.addEventListener("click", async () => {
  const tauri = await getTauriApi();
  if (!tauri) {
    docStatus.textContent = "Tauri indisponivel";
    return;
  }

  const result = await loadDocumentFromFile({ tauri });
  if (!result) {
    return;
  }

  stateFile.path = result.path;
  docStatus.textContent = result.path.split(/[\\/]/).pop();
  applyDocumentSnapshot(result.document);
});

saveDocButton.addEventListener("click", async () => {
  const tauri = await getTauriApi();
  if (!tauri) {
    docStatus.textContent = "Tauri indisponivel";
    return;
  }

  const snapshot = buildDocumentSnapshot();
  const path = await saveDocumentToFile(snapshot, {
    tauri,
    filePath: stateFile.path,
  });

  if (!path) {
    return;
  }

  stateFile.path = path;
  docStatus.textContent = path.split(/[\\/]/).pop();
});

exportPdfButton.addEventListener("click", () => {
  const snapshot = buildDocumentSnapshot();
  const html = renderDocumentToHtml(snapshot);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const preview = window.open(url, "_blank");
  if (!preview) {
    URL.revokeObjectURL(url);
    return;
  }

  preview.addEventListener("load", () => {
    preview.focus();
    preview.print();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
});

document.addEventListener("click", (event) => {
  if (event.target.closest(".block-shell")) {
    return;
  }

  if (state.editingBlockId || state.selectedBlockId) {
    state.editingBlockId = null;
    state.selectedBlockId = null;
    render();
  }
});

render();
