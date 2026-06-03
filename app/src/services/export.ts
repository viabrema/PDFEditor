import { escapeHtml } from "./exportHtmlEscape";
import { getPageSize } from "./exportPageSize";
import { buildExportPrintStyles } from "./exportPrintStyles";
import { renderPage } from "./exportBlockRender";

export { parseCssPx, isExcludedFromPdfExport, filterBlocksForPdfExport } from "./exportBlockRender";

export function renderDocumentToHtml(document?: any) {
  const pages = Array.isArray(document?.pages) ? document.pages : [];
  const pageSize = getPageSize(document?.page?.format, document?.page?.orientation);
  const regions = document?.regions;

  const pageMarkup = pages
    .map((page) => {
      const blocks = Array.isArray(page.blocks) ? page.blocks : [];
      return renderPage(page, blocks, pageSize, regions);
    })
    .join("");

  const styles = buildExportPrintStyles(pageSize);

  return `<!doctype html>\n<html lang="pt-BR">\n  <head>\n    <meta charset="utf-8" />\n    <title>${escapeHtml(document?.title || "Documento")}</title>\n    <style>${styles}</style>\n  </head>\n  <body>\n    <main class="document">${pageMarkup}\n    </main>\n  </body>\n</html>\n`;
}
