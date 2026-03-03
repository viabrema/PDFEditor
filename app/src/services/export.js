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

function renderMarks(text, marks = []) {
  return marks
    .slice()
    .reverse()
    .reduce((current, mark) => {
    if (mark.type === "strong") {
      return `<strong>${current}</strong>`;
    }
    if (mark.type === "em") {
      return `<em>${current}</em>`;
    }
      if (mark.type === "textStyle") {
        const fontSize = sanitizeFontValue(mark.attrs?.fontSize);
        const fontFamily = sanitizeFontValue(mark.attrs?.fontFamily);
        const styles = [];
        if (fontSize) {
          styles.push(`font-size: ${fontSize}`);
        }
        if (fontFamily) {
          styles.push(`font-family: ${fontFamily}`);
        }
        if (styles.length === 0) {
          return current;
        }
        return `<span style="${styles.join("; ")}">${current}</span>`;
      }
    return current;
  }, text);
}

function sanitizeFontValue(value) {
  return value ? String(value).replace(/[";<>]/g, "").trim() : "";
}

function renderNode(node) {
  if (!node) {
    return "";
  }

  if (node.type === "text") {
    return renderMarks(escapeHtml(node.text || ""), node.marks || []);
  }

  const children = Array.isArray(node.content)
    ? node.content.map(renderNode).join("")
    : "";

  switch (node.type) {
    case "doc":
      return children;
    case "paragraph": {
      const align = node.attrs?.textAlign;
      const style = align ? ` style="text-align: ${align}"` : "";
      return `<p${style}>${children}</p>`;
    }
    case "heading": {
      const level = node.attrs?.level || 1;
      const align = node.attrs?.textAlign;
      const style = align ? ` style="text-align: ${align}"` : "";
      return `<h${level}${style}>${children}</h${level}>`;
    }
    case "bullet_list":
      return `<ul>${children}</ul>`;
    case "ordered_list":
      return `<ol>${children}</ol>`;
    case "list_item":
      return `<li>${children}</li>`;
    case "hard_break":
      return "<br />";
    case "horizontal_rule":
      return "<hr />";
    case "chart":
      return '<div class="pm-chart">Chart</div>';
    default:
      return children;
  }
}

function getBlockTextStyle(block) {
  const type = block.type || "text";
  const defaults =
    type === "title"
      ? { fontSize: "26px", fontWeight: "700", color: "#008737" }
      : type === "subtitle"
        ? { fontSize: "18px", fontWeight: "700", color: "#0f172a" }
        : { fontSize: "16px", fontWeight: "400", color: "#0f172a" };
  return {
    fontSize: block.metadata?.fontSize || defaults.fontSize,
    fontFamily: block.metadata?.fontFamily || "",
    fontWeight: defaults.fontWeight,
    color: defaults.color,
    textAlign: block.metadata?.align || "left",
  };
}

function renderTextBlock(block) {
  const html = renderNode(block.content) || "";
  const style = getBlockTextStyle(block);
  const styleParts = [
    `font-size: ${style.fontSize}`,
    `font-weight: ${style.fontWeight}`,
    `color: ${style.color}`,
    `text-align: ${style.textAlign}`,
  ];
  if (style.fontFamily) {
    styleParts.push(`font-family: ${style.fontFamily}`);
  }
  return `<div class=\"block text-block\" style=\"${styleParts.join(
    "; "
  )}\" data-block-id=\"${block.id}\">${html}</div>`;
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

function renderBlock(block, offset = { x: 0, y: 0 }) {
  const style =
    `left:${block.position.x + offset.x}px;` +
    `top:${block.position.y + offset.y}px;` +
    `width:${block.size.width}px;` +
    `height:${block.size.height}px;`;

  if (block.type === "image") {
    return `<div class=\"block-wrapper\" style=\"${style}\">${renderImageBlock(block)}</div>`;
  }
  if (block.type === "table") {
    return `<div class=\"block-wrapper\" style=\"${style}\">${renderTableBlock(block)}</div>`;
  }
  return `<div class=\"block-wrapper\" style=\"${style}\">${renderTextBlock(block)}</div>`;
}

function renderRegionBlocks(blocks, offset) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return "";
  }
  return blocks.map((block) => renderBlock(block, offset)).join("");
}

function renderPage(page, blocks, pageSize, regions) {
  const blockMarkup = blocks.map((block) => renderBlock(block)).join("");
  const headerEnabled = regions?.header?.enabled ?? true;
  const footerEnabled = regions?.footer?.enabled ?? true;
  const headerHeight = regions?.header?.height ?? 0;
  const footerHeight = regions?.footer?.height ?? 0;
  const headerBlocks = headerEnabled ? regions?.header?.blocks || [] : [];
  const footerBlocks = footerEnabled ? regions?.footer?.blocks || [] : [];
  const headerMarkup = renderRegionBlocks(headerBlocks, { x: 0, y: 0 });
  const footerMarkup = renderRegionBlocks(footerBlocks, {
    x: 0,
    y: pageSize.height - footerHeight,
  });
  return `
    <section class=\"page\" data-page-id=\"${page.id}\" style=\"width:${pageSize.width}px;height:${pageSize.height}px;\">
      ${blockMarkup}
      ${headerMarkup}
      ${footerMarkup}
    </section>`;
}

export function renderDocumentToHtml(document) {
  const pages = Array.isArray(document?.pages) ? document.pages : [];
  const pageSize = getPageSize(document?.page?.format, document?.page?.orientation);
  const regions = document?.regions;

  const pageMarkup = pages
    .map((page) => {
      const blocks = Array.isArray(page.blocks) ? page.blocks : [];
      return renderPage(page, blocks, pageSize, regions);
    })
    .join("");

  const styles = `
    @page { size: ${pageSize.width}px ${pageSize.height}px; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: "Segoe UI", system-ui, sans-serif; color: #0f172a; }
    .document { display: flex; flex-direction: column; gap: 24px; padding: 24px; }
    .page { position: relative; background: #fff; border: 1px solid #e2e8f0; }
    .block-wrapper { position: absolute; }
    .block { width: 100%; height: 100%; }
    .text-block { font-size: 14px; line-height: 1.4; padding: 12px; }
    .text-block p { margin: 0 0 10px; }
    .text-block p:last-child { margin-bottom: 0; }
    .text-block h1 { margin: 0 0 12px; font-size: 24px; color: #008737; }
    .text-block h2 { margin: 0 0 10px; font-size: 18px; }
    .text-block ul,
    .text-block ol { margin: 0; padding-left: 20px; list-style-position: outside; }
    .text-block hr { border: none; border-top: 1px solid #0f172a; margin: 10px 0; }
    .image-block img { width: 100%; height: 100%; object-fit: cover; }
    .table-block table { width: 100%; height: 100%; border-collapse: collapse; table-layout: fixed; }
    .table-block td { border: 1px solid #e2e8f0; padding: 6px 8px; font-size: 14px; }
    @media print {
      body { margin: 0; }
      .document { padding: 0; gap: 0; }
      .page { page-break-after: always; border: none; }
    }
  `;

  return `<!doctype html>\n<html lang=\"pt-BR\">\n  <head>\n    <meta charset=\"utf-8\" />\n    <title>${escapeHtml(document?.title || "Documento")}</title>\n    <style>${styles}</style>\n  </head>\n  <body>\n    <main class=\"document\">${pageMarkup}\n    </main>\n  </body>\n</html>\n`;
}
