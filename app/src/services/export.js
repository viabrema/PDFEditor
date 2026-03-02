const PAGE_SIZES = {
  A4: { width: 794, height: 1123 },
  Letter: { width: 816, height: 1056 },
};

function getPageSize(format, orientation) {
  const base = PAGE_SIZES[format] || PAGE_SIZES.A4;
  if (orientation === "landscape") {
    return { width: base.height, height: base.width };
  }
  return base;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

function extractText(node) {
  if (!node) {
    return "";
  }
  if (node.type === "text") {
    return node.text || "";
  }
  if (Array.isArray(node.content)) {
    return node.content.map(extractText).join(" ");
  }
  return "";
}

function renderTextBlock(block) {
  const text = extractText(block.content) || "";
  return `<div class=\"block text-block\" data-block-id=\"${block.id}\">${escapeHtml(text)}</div>`;
}

function renderImageBlock(block) {
  const src = block.content?.src || "";
  return `<div class=\"block image-block\" data-block-id=\"${block.id}\"><img src=\"${escapeHtml(src)}\" alt=\"Imagem\" /></div>`;
}

function renderTableBlock(block) {
  const rows = Array.isArray(block.content?.rows) ? block.content.rows : [];
  const body = rows
    .map((row) => {
      const cells = row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `<div class=\"block table-block\" data-block-id=\"${block.id}\"><table><tbody>${body}</tbody></table></div>`;
}

function renderBlock(block) {
  const style = `left:${block.position.x}px;top:${block.position.y}px;width:${block.size.width}px;height:${block.size.height}px;`;

  if (block.type === "image") {
    return `<div class=\"block-wrapper\" style=\"${style}\">${renderImageBlock(block)}</div>`;
  }
  if (block.type === "table") {
    return `<div class=\"block-wrapper\" style=\"${style}\">${renderTableBlock(block)}</div>`;
  }
  return `<div class=\"block-wrapper\" style=\"${style}\">${renderTextBlock(block)}</div>`;
}

function renderPage(page, blocks, pageSize) {
  const blockMarkup = blocks.map(renderBlock).join("");
  return `
    <section class=\"page\" data-page-id=\"${page.id}\" style=\"width:${pageSize.width}px;height:${pageSize.height}px;\">
      ${blockMarkup}
    </section>`;
}

export function renderDocumentToHtml(document) {
  const pages = Array.isArray(document?.pages) ? document.pages : [];
  const pageSize = getPageSize(document?.page?.format, document?.page?.orientation);

  const pageMarkup = pages
    .map((page) => {
      const blocks = Array.isArray(page.blocks) ? page.blocks : [];
      return renderPage(page, blocks, pageSize);
    })
    .join("");

  const styles = `
    @page { size: ${pageSize.width}px ${pageSize.height}px; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: "Times New Roman", serif; color: #0f172a; }
    .document { display: flex; flex-direction: column; gap: 24px; padding: 24px; }
    .page { position: relative; background: #fff; border: 1px solid #e2e8f0; }
    .block-wrapper { position: absolute; }
    .block { width: 100%; height: 100%; }
    .text-block { font-size: 14px; white-space: pre-wrap; }
    .image-block img { width: 100%; height: 100%; object-fit: contain; }
    .table-block table { width: 100%; height: 100%; border-collapse: collapse; table-layout: fixed; }
    .table-block td { border: 1px solid #e2e8f0; padding: 6px; font-size: 12px; }
    @media print {
      body { margin: 0; }
      .document { padding: 0; gap: 0; }
      .page { page-break-after: always; border: none; }
    }
  `;

  return `<!doctype html>\n<html lang=\"pt-BR\">\n  <head>\n    <meta charset=\"utf-8\" />\n    <title>${escapeHtml(document?.title || "Documento")}</title>\n    <style>${styles}</style>\n  </head>\n  <body>\n    <main class=\"document\">${pageMarkup}\n    </main>\n  </body>\n</html>\n`;
}
