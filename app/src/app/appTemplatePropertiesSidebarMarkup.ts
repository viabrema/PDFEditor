/** Fragmento HTML: painel lateral de propriedades (pagina / bloco selecionado). */
export const APP_TEMPLATE_PROPERTIES_SIDEBAR_MARKUP = `
        <aside
          id="properties-sidebar"
          class="properties-sidebar overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          aria-label="Propriedades"
        >
          <div class="shrink-0 border-b border-slate-200 px-4 py-3">
            <h2
              id="properties-sidebar-title"
              class="text-sm font-semibold text-slate-900"
            >
              Pagina
            </h2>
            <p id="properties-sidebar-subtitle" class="mt-0.5 text-xs text-slate-500">
              Formato, orientacao e grelha
            </p>
          </div>
          <div class="min-h-0 flex-1 overflow-y-auto">
            <div id="properties-sidebar-page-panel" class="flex flex-col gap-4 p-4">
              <div class="grid gap-3">
                <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium uppercase tracking-wide text-slate-500" for="page-format">
                    Formato
                  </label>
                  <select
                    id="page-format"
                    class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
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
                    class="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="portrait">Retrato</option>
                    <option value="landscape">Paisagem</option>
                  </select>
                </div>
              </div>
              <div
                id="page-dimensions"
                class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
              ></div>
              <div class="grid gap-3">
                <div class="flex flex-col gap-1">
                  <label class="text-xs font-medium uppercase tracking-wide text-slate-500" for="grid-size">
                    Grid (px)
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
                <label class="flex items-center gap-2 text-sm text-slate-700">
                  <input id="grid-snap" type="checkbox" class="h-4 w-4" />
                  Snap a grelha
                </label>
              </div>
              <div class="flex flex-col gap-2 border-t border-slate-100 pt-3">
                <label class="flex items-center gap-2 text-sm text-slate-700">
                  <input id="page-header-toggle" type="checkbox" class="h-4 w-4" />
                  Exibir cabecalho
                </label>
                <label class="flex items-center gap-2 text-sm text-slate-700">
                  <input id="page-footer-toggle" type="checkbox" class="h-4 w-4" />
                  Exibir rodape
                </label>
              </div>
              <div class="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <span class="text-xs font-medium uppercase tracking-wide text-slate-500">Pagina ativa</span>
                <div id="page-meta" class="mt-1 text-xs leading-relaxed"></div>
              </div>
            </div>
            <div
              id="properties-sidebar-block-panel"
              class="properties-sidebar-tools hidden flex-col gap-4 p-4"
            ></div>
          </div>
        </aside>
      </section>
`;
