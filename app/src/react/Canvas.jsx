import React, { useEffect, useRef } from "react";
import { getPageSize } from "../app/textUtils.js";
import { setupRegionResize } from "../app/regionResize.js";
import { BlockShell } from "./blocks/BlockShell.jsx";

export function Canvas({ documentData, state, blocks, onUpdate }) {
  const headerRefs = useRef(new Map());
  const footerRefs = useRef(new Map());

  const activeBlocks = blocks.filter(
    (block) => block.languageId === state.activeLanguageId
  );

  const headerBlocks = activeBlocks.filter(
    (block) => block.metadata?.region === "header"
  );
  const footerBlocks = activeBlocks.filter(
    (block) => block.metadata?.region === "footer"
  );
  const bodyBlocks = activeBlocks.filter(
    (block) =>
      block.metadata?.region !== "header" && block.metadata?.region !== "footer"
  );

  useEffect(() => {
    headerRefs.current.forEach((value, key) => {
      if (!value) {
        headerRefs.current.delete(key);
      }
    });
    footerRefs.current.forEach((value, key) => {
      if (!value) {
        footerRefs.current.delete(key);
      }
    });
  });

  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6">
      <div className="flex w-full flex-col gap-6 rounded-xl bg-slate-50 p-6">
        {documentData.pages.map((page) => {
          const { width, height } = getPageSize(
            documentData.page.format,
            documentData.page.orientation
          );
          const pageBlocks = bodyBlocks.filter((block) => block.pageId === page.id);
          const isActivePage =
            state.activePageId === page.id && state.activeRegion === "body";
          const surfaceClassName = [
            "page-surface",
            documentData.grid.snap ? "grid-on" : "",
            isActivePage ? "is-active" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div key={page.id} className="page-shell">
              <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                {page.name}
              </div>
              <div
                className={surfaceClassName}
                style={{
                  width: `${width}px`,
                  height: `${height}px`,
                  "--grid-size": `${documentData.grid.size}px`,
                }}
                onClick={() => {
                  const shouldClear = state.editingBlockId || state.selectedBlockId;
                  const shouldRender =
                    shouldClear ||
                    state.activePageId !== page.id ||
                    state.activeRegion !== "body";
                  state.activePageId = page.id;
                  state.activeRegion = "body";
                  if (shouldClear) {
                    state.editingBlockId = null;
                    state.selectedBlockId = null;
                  }
                  if (shouldRender) {
                    onUpdate();
                  }
                }}
              >
                {pageBlocks.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-300">
                    Sem blocos
                  </div>
                )}
                {pageBlocks.map((block) => (
                  <BlockShell
                    key={block.id}
                    block={block}
                    documentData={documentData}
                    state={state}
                    onUpdate={onUpdate}
                    pageId={page.id}
                    region="body"
                  />
                ))}
                {documentData.regions?.header?.enabled && (
                  <RegionOverlay
                    pageId={page.id}
                    region="header"
                    blocks={headerBlocks}
                    state={state}
                    documentData={documentData}
                    height={documentData.regions.header.height}
                    onUpdate={onUpdate}
                    onResize={(node) => {
                      const cleanup = setupRegionResize({
                        element: node,
                        region: "header",
                        documentData,
                        pageSize: { width, height },
                        onFinish: onUpdate,
                      });
                      headerRefs.current.set(page.id, cleanup);
                    }}
                  />
                )}
                {documentData.regions?.footer?.enabled && (
                  <RegionOverlay
                    pageId={page.id}
                    region="footer"
                    blocks={footerBlocks}
                    state={state}
                    documentData={documentData}
                    height={documentData.regions.footer.height}
                    onUpdate={onUpdate}
                    onResize={(node) => {
                      const cleanup = setupRegionResize({
                        element: node,
                        region: "footer",
                        documentData,
                        pageSize: { width, height },
                        onFinish: onUpdate,
                      });
                      footerRefs.current.set(page.id, cleanup);
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RegionOverlay({
  pageId,
  region,
  blocks,
  state,
  documentData,
  height,
  onUpdate,
  onResize,
}) {
  const regionRef = useRef(null);
  const isActive = state.activeRegion === region && state.activePageId === pageId;

  useEffect(() => {
    if (regionRef.current) {
      onResize(regionRef.current);
    }
  }, [onResize]);

  return (
    <div
      ref={regionRef}
      className={`page-region ${region === "header" ? "is-header" : "is-footer"} ${
        isActive ? "is-active" : ""
      }`}
      style={{ height: `${height}px` }}
      onClick={(event) => {
        event.stopPropagation();
        const shouldClear = state.editingBlockId || state.selectedBlockId;
        const shouldRender =
          shouldClear || state.activePageId !== pageId || state.activeRegion !== region;
        state.activePageId = pageId;
        state.activeRegion = region;
        if (shouldClear) {
          state.editingBlockId = null;
          state.selectedBlockId = null;
        }
        if (shouldRender) {
          onUpdate();
        }
      }}
    >
      <div
        className={`region-resize-handle ${
          region === "header" ? "is-bottom" : "is-top"
        }`}
      />
      {blocks.map((block) => (
        <BlockShell
          key={block.id}
          block={block}
          documentData={documentData}
          state={state}
          onUpdate={onUpdate}
          pageId={pageId}
          region={region}
        />
      ))}
    </div>
  );
}
