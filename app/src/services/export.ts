import { renderTableBlockMarkup } from "./exportTableMarkup";

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
    .replace(/"/g, "&quot;");
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

/** Deve coincidir com `.text-block { padding }` em `renderDocumentToHtml`. */
const EXPORT_TEXT_BLOCK_PADDING_Y = 24;

/** Deve coincidir com `.text-block { line-height }` em `renderDocumentToHtml`. */
const EXPORT_TEXT_LINE_HEIGHT_RATIO = 1.4;

export function parseCssPx(value, fallbackPx) {
  const m = String(value || "").match(/([\d.]+)\s*px/i);
  return m ? parseFloat(m[1]) : fallbackPx;
}

/**
 * Nº de linhas de texto que cabem na caixa do bloco (export PDF), para line-clamp + reticências.
 */
function computeExportTextLineClamp(block) {
  const h = Number(block?.size?.height);
  if (!Number.isFinite(h) || h <= 0) {
    return 1;
  }
  const style = getBlockTextStyle(block);
  const fontPx = parseCssPx(style.fontSize, 16);
  const inner = Math.max(0, h - EXPORT_TEXT_BLOCK_PADDING_Y);
  const lineHeightPx = fontPx * EXPORT_TEXT_LINE_HEIGHT_RATIO;
  if (lineHeightPx <= 0) {
    return 1;
  }
  let lines = Math.floor(inner / lineHeightPx);
  if (lines > 2) {
    lines -= 1;
  }
  return Math.max(1, Math.min(lines, 9999));
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

function getHeadingLevel(block) {
  const rawLevel =
    block.type === "title"
      ? 1
      : block.type === "subtitle"
        ? 2
        : block.metadata?.headingLevel ?? block.metadata?.level;
  const level = Number(rawLevel) || 1;
  return Math.min(3, Math.max(1, level));
}

function getBlockTextStyle(block) {
  const type = block.type || "text";
  const headingStyles = {
    1: { fontSize: "26px", fontWeight: "700", color: "#008737" },
    2: { fontSize: "22px", fontWeight: "700", color: "#1f2937" },
    3: { fontSize: "18px", fontWeight: "400", color: "#0f172a" },
  };
  const isHeading = type === "heading" || type === "title" || type === "subtitle";
  const defaults = isHeading
    ? headingStyles[getHeadingLevel(block)]
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
  const lineClamp = computeExportTextLineClamp(block);
  const styleParts = [
    `font-size: ${style.fontSize}`,
    `font-weight: ${style.fontWeight}`,
    `color: ${style.color}`,
    `text-align: ${style.textAlign}`,
  ];
  if (style.fontFamily) {
    styleParts.push(`font-family: ${style.fontFamily}`);
  }
  const clampParts = [
    "max-height: 100%",
    "overflow: hidden",
    "display: -webkit-box",
    "-webkit-box-orient: vertical",
    `-webkit-line-clamp: ${lineClamp}`,
    `line-clamp: ${lineClamp}`,
    "word-break: break-word",
  ];
  return `<div class="block text-block" style="${styleParts.join(
    "; "
  )}" data-block-id="${block.id}"><div class="text-block-export-flow" style="${clampParts.join(
    "; "
  )}">${html}</div></div>`;
}

function renderImageBlock(block) {
  const src = block.content?.src || "";
  return `<div class="block image-block" data-block-id="${block.id}"><img src="${escapeHtml(src)}" alt="Imagem" /></div>`;
}

function renderTableBlock(block) {
  return renderTableBlockMarkup(block, escapeHtml);
}

function renderBlock(block, offset = { x: 0, y: 0 }) {
  const style =
    `left:${block.position.x + offset.x}px;` +
    `top:${block.position.y + offset.y}px;` +
    `width:${block.size.width}px;` +
    `height:${block.size.height}px;`;

  if (block.type === "image") {
    return `<div class="block-wrapper" style="${style}">${renderImageBlock(block)}</div>`;
  }
  if (block.type === "table" || block.type === "linkedTable") {
    return `<div class="block-wrapper" style="${style}">${renderTableBlock(block)}</div>`;
  }
  return `<div class="block-wrapper" style="${style}">${renderTextBlock(block)}</div>`;
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
    <section class="page" data-page-id="${page.id}" style="width:${pageSize.width}px;height:${pageSize.height}px;">
      ${blockMarkup}
      ${headerMarkup}
      ${footerMarkup}
    </section>`;
}

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

  const styles = `
    @page { size: ${pageSize.width}px ${pageSize.height}px; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: "Segoe UI", system-ui, sans-serif; color: #0f172a; }
    .document { display: flex; flex-direction: column; gap: 24px; padding: 24px; }
    .page { position: relative; background: #fff; border: 1px solid #e2e8f0; }
    .block-wrapper { position: absolute; }
    .block { width: 100%; height: 100%; }
    .text-block { font-size: 14px; line-height: 1.4; padding: 12px; overflow: hidden; }
    .text-block-export-flow { min-height: 0; }
    .text-block p { margin: 0 0 10px; }
    .text-block p:last-child { margin-bottom: 0; }
    .text-block h1 { margin: 0 0 12px; font-size: 24px; color: #008737; }
    .text-block h2 { margin: 0 0 10px; font-size: 18px; }
    .text-block ul,
    .text-block ol { margin: 0; padding-left: 20px; list-style-position: outside; }
    .text-block hr { border: none; border-top: 1px solid #0f172a; margin: 10px 0; }
    .image-block img { width: 100%; height: 100%; object-fit: cover; }
    .table-block { overflow: hidden; }
    .table-block-export-clip { width: 100%; height: 100%; overflow: hidden; }
    .table-block table { width: 100%; height: auto; border-collapse: collapse; table-layout: fixed; }
    .table-block td {
      border: 1px solid #e2e8f0;
      padding: 6px 8px;
      font-size: 14px;
      vertical-align: top;
      overflow: hidden;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .table-block-excel td {
      border: none;
    }
    @media print {
      body { margin: 0; }
      .document { padding: 0; gap: 0; }
      .page { page-break-after: always; border: none; }
    }
  `;

  return `<!doctype html>\n<html lang="pt-BR">\n  <head>\n    <meta charset="utf-8" />\n    <title>${escapeHtml(document?.title || "Documento")}</title>\n    <style>${styles}</style>\n  </head>\n  <body>\n    <main class="document">${pageMarkup}\n    </main>\n  </body>\n</html>\n`;
}
