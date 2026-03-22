export function renderAppTemplate(root) {
  root.innerHTML = `
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
            <button
              id="page-settings"
              type="button"
              class="icon-button rounded-md border border-slate-300 bg-white text-slate-700"
              title="Configuracao da pagina"
              aria-label="Configuracao da pagina"
            >
              <i data-lucide="settings-2"></i>
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
      <section class="w-full px-6 py-6">
        <div class="sticky top-0 z-30 -mx-6 mb-4 border-b border-slate-200 bg-slate-50/95 px-6 py-3 backdrop-blur">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex flex-wrap items-center gap-3">
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
                title="Atualizar links Excel das tabelas linkadas"
                aria-label="Atualizar links Excel"
              >
                <i data-lucide="refresh-cw"></i>
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
        <div class="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6">
          <div
            id="canvas"
            class="flex w-full flex-col gap-6 rounded-xl bg-slate-50 p-6"
          ></div>
        </div>
      </section>
      <div
        id="page-settings-modal"
        class="fixed inset-0 z-40 hidden items-center justify-center bg-slate-900/40 px-4"
        aria-hidden="true"
        role="dialog"
        aria-modal="true"
      >
        <div class="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
          <div class="mb-4 flex items-center justify-between">
            <div>
              <div class="text-lg font-semibold text-slate-900">Configuracao da pagina</div>
              <div class="text-xs text-slate-500">Formato, orientacao e grid</div>
            </div>
            <button
              id="page-settings-close"
              type="button"
              class="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600"
            >
              Fechar
            </button>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
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
                class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div class="flex items-center gap-2 pt-6">
              <input id="grid-snap" type="checkbox" class="h-4 w-4" />
              <label class="text-xs font-medium uppercase tracking-wide text-slate-500" for="grid-snap">
                Snap
              </label>
            </div>
          </div>
          <div class="mt-4 flex flex-wrap items-center gap-4">
            <label class="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              <input id="page-header-toggle" type="checkbox" class="h-4 w-4" />
              Exibir cabecalho
            </label>
            <label class="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              <input id="page-footer-toggle" type="checkbox" class="h-4 w-4" />
              Exibir rodape
            </label>
          </div>
          <div class="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <span class="text-xs font-medium uppercase tracking-wide text-slate-500">Pagina ativa</span>
            <div id="page-meta"></div>
          </div>
        </div>
      </div>
      <div
        id="excel-link-modal"
        class="fixed inset-0 z-40 hidden items-center justify-center bg-slate-900/40 px-4"
        aria-hidden="true"
        role="dialog"
        aria-modal="true"
      >
        <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <div class="mb-4">
            <div class="text-lg font-semibold text-slate-900">Intervalo Excel</div>
            <div class="text-xs text-slate-500">Escolha a folha e o quadrado (ex.: A1:G5)</div>
          </div>
          <div class="grid gap-3">
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium uppercase tracking-wide text-slate-500" for="excel-link-sheet">
                Folha
              </label>
              <select
                id="excel-link-sheet"
                class="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              ></select>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium uppercase tracking-wide text-slate-500" for="excel-link-range">
                Intervalo
              </label>
              <input
                id="excel-link-range"
                type="text"
                placeholder="A1:G5"
                class="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-mono"
                autocomplete="off"
              />
            </div>
            <p id="excel-link-modal-error" class="min-h-[1.25rem] text-xs text-red-600"></p>
          </div>
          <div class="mt-6 flex justify-end gap-2">
            <button
              id="excel-link-cancel"
              type="button"
              class="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600"
            >
              Cancelar
            </button>
            <button
              id="excel-link-confirm"
              type="button"
              class="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
      <aside id="ai-panel" class="ai-panel" aria-hidden="true">
        <div class="ai-panel-header">
          <div class="text-sm font-semibold text-slate-900">AI Assistente</div>
          <button id="ai-panel-close" type="button" class="ai-panel-close">Fechar</button>
        </div>
        <div class="ai-panel-body">
          <div id="ai-target" class="text-xs text-slate-500">Selecione um bloco</div>
          <textarea
            id="ai-input"
            class="ai-panel-input"
            rows="6"
            placeholder="Descreva o que deseja mudar..."
          ></textarea>
          <button id="ai-send" type="button" class="ai-panel-send">Enviar</button>
          <div id="ai-status" class="text-xs text-slate-500"></div>
          <pre id="ai-response" class="ai-panel-response"></pre>
        </div>
      </aside>
    </main>
  `;
}
