/** Fragmento HTML: modais de grafico, Excel e painel de IA. */
export const APP_TEMPLATE_MODALS_MARKUP = `
      <div
        id="chart-config-modal"
        class="fixed inset-0 z-[70] hidden items-center justify-center bg-slate-900/40 px-4"
        aria-hidden="true"
        role="dialog"
        aria-modal="true"
      >
        <div class="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
          <div class="mb-4 flex items-center justify-between">
            <div>
              <div class="text-lg font-semibold text-slate-900">Configurar grafico</div>
              <div class="text-xs text-slate-500">Fonte de dados na grelha abaixo; series e aparencia na aba Interface</div>
            </div>
            <button
              id="chart-config-close"
              type="button"
              class="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-600"
            >
              Fechar
            </button>
          </div>
          <div class="mb-4 flex gap-2 border-b border-slate-200 pb-2">
            <button
              id="chart-config-tab-data"
              type="button"
              class="chart-config-tab rounded-md px-3 py-1.5 text-sm font-semibold text-slate-900 bg-slate-100"
              data-tab="data"
            >
              Fonte de dados
            </button>
            <button
              id="chart-config-tab-interface"
              type="button"
              class="chart-config-tab rounded-md px-3 py-1.5 text-sm font-semibold text-slate-500"
              data-tab="interface"
            >
              Interface
            </button>
          </div>
          <div id="chart-config-panel-data" class="chart-config-panel grid gap-4">
            <div class="flex flex-wrap items-center gap-2">
              <button
                id="chart-config-add-grid-row"
                type="button"
                class="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
              >
                + Linha
              </button>
              <button
                id="chart-config-add-grid-col"
                type="button"
                class="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
              >
                + Coluna
              </button>
              <button
                id="chart-config-remove-grid-row"
                type="button"
                class="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
              >
                − Ultima linha
              </button>
              <button
                id="chart-config-remove-grid-col"
                type="button"
                class="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
              >
                − Ultima coluna
              </button>
            </div>
            <label class="flex items-center gap-2 text-sm text-slate-700">
              <input id="chart-config-first-row-header" type="checkbox" class="h-4 w-4" checked />
              Primeira linha e cabecalho de colunas
            </label>
            <div class="max-h-[min(50vh,320px)] overflow-auto rounded-lg border border-slate-200">
              <div id="chart-config-data-grid" class="p-2"></div>
            </div>
          </div>
          <div id="chart-config-panel-interface" class="chart-config-panel hidden grid gap-4">
            <div class="grid gap-3 sm:grid-cols-2">
              <div class="flex flex-col gap-1">
                <label class="text-xs font-medium uppercase tracking-wide text-slate-500" for="chart-config-base-type">
                  Tipo de grafico
                </label>
                <select
                  id="chart-config-base-type"
                  class="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                ></select>
              </div>
              <div class="flex flex-col gap-1">
                <label class="text-xs font-medium uppercase tracking-wide text-slate-500" for="chart-config-chart-title">
                  Titulo (opcional)
                </label>
                <input
                  id="chart-config-chart-title"
                  type="text"
                  class="rounded-md border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Titulo do grafico"
                />
              </div>
            </div>
            <div class="flex flex-wrap gap-4">
              <label class="flex items-center gap-2 text-xs text-slate-600">
                <input id="chart-config-legend" type="checkbox" class="h-4 w-4" checked />
                Mostrar legenda
              </label>
              <label class="flex items-center gap-2 text-xs text-slate-600">
                <input id="chart-config-y-right" type="checkbox" class="h-4 w-4" />
                Eixo Y a direita
              </label>
            </div>
            <div>
              <div class="mb-2 flex items-center justify-between">
                <span class="text-xs font-medium uppercase tracking-wide text-slate-500">Series</span>
                <button
                  id="chart-config-add-dataset"
                  type="button"
                  class="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                >
                  + Nova serie
                </button>
              </div>
              <div id="chart-config-datasets" class="flex flex-col gap-2"></div>
            </div>
          </div>
          <p id="chart-config-modal-error" class="mt-4 min-h-[1.25rem] text-xs text-red-600"></p>
          <div class="mt-6 flex justify-end gap-2">
            <button
              id="chart-config-cancel"
              type="button"
              class="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600"
            >
              Cancelar
            </button>
            <button
              id="chart-config-apply"
              type="button"
              class="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white"
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>
      <div
        id="excel-link-modal"
        class="fixed inset-0 z-[70] hidden items-center justify-center bg-slate-900/40 px-4"
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
          <div id="ai-target" class="text-xs text-slate-500">Contexto do documento</div>
          <div
            id="ai-selection-chips"
            class="ai-selection-chips"
            aria-label="Blocos selecionados como referencia para a IA"
          ></div>
          <div
            id="ai-history"
            class="ai-panel-history"
            role="log"
            aria-label="Historico da conversa com a IA"
          ></div>
          <div id="ai-status" class="text-xs text-slate-500"></div>
          <div class="ai-panel-compose">
            <textarea
              id="ai-input"
              class="ai-panel-input"
              rows="5"
              placeholder="Descreva o que deseja mudar..."
            ></textarea>
            <button id="ai-send" type="button" class="ai-panel-send">Enviar</button>
          </div>
        </div>
      </aside>
    </main>
`;
