/** Fragmento HTML: cabecalho da app e barra de ferramentas superior. */
export const APP_TEMPLATE_HEADER_MARKUP = `
    <main class="flex h-full min-h-0 flex-col overflow-hidden bg-slate-50 text-slate-900">
      <header class="shrink-0 border-b border-slate-200 bg-white">
        <div class="flex w-full items-center justify-between px-6 py-4">
          <div>
            <h1 class="text-2xl font-semibold">PDF Editor</h1>
            <p class="text-sm text-slate-600">Editor em modo rascunho</p>
          </div>
          <div class="flex items-center gap-2">
            <button
              id="undo-doc"
              type="button"
              class="icon-button rounded-md border border-slate-300 bg-white text-slate-700 disabled:opacity-40"
              title="Desfazer (Ctrl+Z)"
              aria-label="Desfazer"
              disabled
            >
              <i data-lucide="undo-2"></i>
            </button>
            <button
              id="redo-doc"
              type="button"
              class="icon-button rounded-md border border-slate-300 bg-white text-slate-700 disabled:opacity-40"
              title="Refazer (Ctrl+Y)"
              aria-label="Refazer"
              disabled
            >
              <i data-lucide="redo-2"></i>
            </button>
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
              id="save-template"
              type="button"
              class="icon-button rounded-md border border-slate-300 bg-white text-slate-700"
              title="Salvar template"
              aria-label="Salvar template"
            >
              <i data-lucide="file-json"></i>
            </button>
            <button
              id="open-template"
              type="button"
              class="icon-button rounded-md border border-slate-300 bg-white text-slate-700"
              title="Carregar template"
              aria-label="Carregar template"
            >
              <i data-lucide="file-input"></i>
            </button>
            <button
              id="toggle-hidden-data"
              type="button"
              class="icon-button rounded-md border border-slate-300 bg-white text-slate-700"
              title="Ver dados ocultos"
              aria-label="Ver dados ocultos"
            >
              <i data-lucide="eye"></i>
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
            <button
              id="ai-panel-toggle"
              type="button"
              class="icon-button rounded-md border border-slate-300 bg-white text-slate-700"
              title="Abrir AI"
              aria-label="Abrir AI"
            >
              <i data-lucide="sparkles"></i>
            </button>
            <div id="doc-status" class="text-xs text-slate-500">Documento local</div>
          </div>
        </div>
      </header>
      <section class="workspace-shell flex min-h-0 w-full flex-1 flex-row flex-nowrap gap-4 px-4 py-4">
        <div class="workspace-main flex min-h-0 min-w-0 flex-1 flex-col">
        <div class="sticky top-0 z-30 -mx-6 mb-4 border-b border-slate-200 bg-slate-50/95 px-6 py-3 backdrop-blur">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex flex-wrap items-center gap-3">
              <div class="text-xs font-medium uppercase tracking-wide text-slate-500">Paginas</div>
              <button
                id="add-page"
                type="button"
                class="icon-button rounded-md border border-slate-300 bg-white px-2 py-2 text-slate-700"
                title="Nova pagina"
                aria-label="Nova pagina"
              >
                <i data-lucide="file-plus"></i>
              </button>
              <button
                id="remove-page"
                type="button"
                class="icon-button rounded-md border border-slate-300 bg-white px-2 py-2 text-slate-700"
                title="Apagar pagina ativa"
                aria-label="Apagar pagina ativa"
              >
                <i data-lucide="file-minus"></i>
              </button>
              <div class="h-6 w-px bg-slate-200" aria-hidden="true"></div>
              <div class="text-xs font-medium uppercase tracking-wide text-slate-500">Idiomas</div>
              <div class="flex flex-wrap gap-2" id="language-tabs"></div>
              <div class="flex items-center gap-2" id="language-actions"></div>
              <div id="translation-status" class="text-xs text-slate-500"></div>
            </div>
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
                id="add-heading-block"
                type="button"
                class="icon-button rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-700"
                title="Novo bloco de titulo"
                aria-label="Novo bloco de titulo"
              >
                <i data-lucide="heading-1"></i>
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
                id="add-linked-table-block"
                type="button"
                class="icon-button rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-700"
                title="Tabela linkada ao Excel"
                aria-label="Tabela linkada ao Excel"
              >
                <i data-lucide="sheet"></i>
              </button>
              <button
                id="refresh-linked-tables"
                type="button"
                class="icon-button rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-700"
                title="Atualizar dados Excel (tabelas e graficos linkados)"
                aria-label="Atualizar links Excel"
              >
                <i data-lucide="refresh-cw"></i>
              </button>
              <button
                id="add-chart-block"
                type="button"
                class="icon-button rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-700"
                title="Novo bloco de grafico"
                aria-label="Novo bloco de grafico"
              >
                <i data-lucide="line-chart"></i>
              </button>
              <button
                id="add-linked-chart-block"
                type="button"
                class="icon-button rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-700"
                title="Grafico com dados do Excel"
                aria-label="Grafico linkado ao Excel"
              >
                <i data-lucide="chart-column"></i>
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
              <input id="excel-link-file-input" type="file" accept=".xlsx,.xls,.xlsm,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" class="hidden" />
            </div>
          </div>
        </div>
`;
