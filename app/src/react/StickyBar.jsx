import React from "react";
import { createBlock } from "../blocks/blockModel.js";
import { createImageBlockFromFile } from "../blocks/imageBlock.js";
import { createTableBlockFromRows } from "../blocks/tableBlock.js";
import { getNextBlockPosition, getPageSize, getRegionSize } from "../app/textUtils.js";
import { getDefaultLanguageId } from "../app/translationFlow.js";

export function StickyBar({ documentData, state, blocks, onTranslate, onUpdate }) {
  const defaultLanguageId = getDefaultLanguageId(documentData);
  const canTranslate =
    state.activeLanguageId && state.activeLanguageId !== defaultLanguageId;

  const getRegionContext = () => {
    const region = state.activeRegion || "body";
    const isBody = region === "body";
    const blocksForRegion = blocks.filter((block) => {
      const matchesLanguage = block.languageId === state.activeLanguageId;
      if (!matchesLanguage) {
        return false;
      }
      if (isBody) {
        return (
          block.pageId === state.activePageId &&
          block.metadata?.region !== "header" &&
          block.metadata?.region !== "footer"
        );
      }
      return block.metadata?.region === region;
    });

    const regionSize = isBody
      ? getPageSize(documentData.page.format, documentData.page.orientation)
      : getRegionSize({ documentData, region });

    return { region, isBody, blocksForRegion, regionSize };
  };

  const handleAddText = () => {
    const { region, isBody, blocksForRegion, regionSize } = getRegionContext();
    const blockSize = { width: 520, height: 220 };
    const position = getNextBlockPosition({
      blocksForPage: blocksForRegion,
      blockSize,
      pageSize: regionSize,
    });

    blocks.push(
      createBlock({
        position,
        size: blockSize,
        pageId: isBody ? state.activePageId : null,
        languageId: state.activeLanguageId,
        metadata: isBody ? {} : { region },
        content: "",
      })
    );
    onUpdate();
  };

  const handleAddTable = () => {
    const { region, isBody, blocksForRegion, regionSize } = getRegionContext();
    const position = getNextBlockPosition({
      blocksForPage: blocksForRegion,
      blockSize: { width: 520, height: 220 },
      pageSize: regionSize,
    });

    const tableBlock = createTableBlockFromRows(
      [
        ["", ""],
        ["", ""],
      ],
      {
        pageId: isBody ? state.activePageId : null,
        languageId: state.activeLanguageId,
        position,
        pageSize: regionSize,
        metadata: isBody ? {} : { region },
      }
    );

    blocks.push(tableBlock);
    onUpdate();
  };

  const handleAddImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const { region, isBody, blocksForRegion, regionSize } = getRegionContext();
    const position = getNextBlockPosition({
      blocksForPage: blocksForRegion,
      blockSize: { width: 520, height: 360 },
      pageSize: regionSize,
    });

    const block = await createImageBlockFromFile(file, {
      pageId: isBody ? state.activePageId : null,
      languageId: state.activeLanguageId,
      position,
      pageSize: regionSize,
      metadata: isBody ? {} : { region },
    });

    blocks.push(block);
    event.target.value = "";
    onUpdate();
  };

  return (
    <div className="sticky top-0 z-30 -mx-6 mb-4 border-b border-slate-200 bg-slate-50/95 px-6 py-3 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Idiomas
          </div>
          <div className="flex flex-wrap gap-2">
            {documentData.languages.map((language) => (
              <button
                key={language.id}
                type="button"
                className={
                  language.id === state.activeLanguageId
                    ? "rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white"
                    : "rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                }
                onClick={() => {
                  state.activeLanguageId = language.id;
                  state.selectedBlockId = null;
                  state.editingBlockId = null;
                  onUpdate();
                }}
              >
                {language.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {canTranslate && (
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-2 py-1 text-slate-700"
                title="Atualizar traducao"
                aria-label="Atualizar traducao"
                disabled={state.translation.loading}
                onClick={() => {
                  if (!state.translation.loading) {
                    onTranslate(state.activeLanguageId);
                  }
                }}
              >
                <i data-lucide="languages"></i>
              </button>
            )}
          </div>
          <div className="text-xs text-slate-500">
            {state.translation.loading ? "Traduzindo..." : state.translation.error || ""}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="icon-button rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-700"
            title="Novo bloco de texto"
            aria-label="Novo bloco de texto"
            onClick={handleAddText}
          >
            <i data-lucide="type"></i>
          </button>
          <button
            type="button"
            className="icon-button rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-700"
            title="Novo bloco de tabela"
            aria-label="Novo bloco de tabela"
            onClick={handleAddTable}
          >
            <i data-lucide="table"></i>
          </button>
          <label className="icon-button rounded-md bg-slate-900 px-3 py-2 text-white" title="Novo bloco de imagem">
            <i data-lucide="image"></i>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAddImage}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
