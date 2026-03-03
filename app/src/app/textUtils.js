import { PAGE_SIZES } from "./config.js";

export function getPageSize(format, orientation) {
  const base = PAGE_SIZES[format] || PAGE_SIZES.A4;
  if (orientation === "landscape") {
    return { width: base.height, height: base.width };
  }
  return base;
}

export function extractTextFromNode(node) {
  if (!node) {
    return "";
  }
  if (typeof node === "string") {
    return node;
  }
  if (node.type === "text") {
    return node.text || "";
  }
  if (node.type === "hard_break") {
    return "\n";
  }
  if (!Array.isArray(node.content)) {
    return "";
  }
  const content = node.content.map(extractTextFromNode).join("");
  if (node.type === "paragraph" || node.type === "list_item") {
    return `${content}\n`;
  }
  return content;
}

export function buildTextDocFromString(text) {
  const trimmed = String(text || "").replace(/\r\n/g, "\n");
  const blocks = trimmed.split(/\n{2,}/g);
  const paragraphs = blocks.length ? blocks : [""];
  return {
    type: "doc",
    content: paragraphs.map((paragraph) => ({
      type: "paragraph",
      content: paragraph
        ? paragraph.split("\n").flatMap((segment, index, items) => {
            const nodes = [];
            if (segment) {
              nodes.push({ type: "text", text: segment });
            }
            if (index < items.length - 1) {
              nodes.push({ type: "hard_break" });
            }
            return nodes;
          })
        : [],
    })),
  };
}

export function getNextBlockPosition({ blocksForPage, blockSize, pageSize }) {
  const padding = 32;
  const offset = 24;

  if (blocksForPage.length === 0) {
    return { x: padding, y: padding };
  }

  const maxBottom = Math.max(
    ...blocksForPage.map((block) => block.position.y + block.size.height)
  );
  let nextX = padding;
  let nextY = maxBottom + offset;

  if (nextY + blockSize.height > pageSize.height - padding) {
    nextY = padding;
    nextX = padding + offset;
  }

  return { x: nextX, y: nextY };
}

export function getRegionSize({ documentData, region }) {
  const pageSize = getPageSize(
    documentData.page?.format,
    documentData.page?.orientation
  );
  if (region === "header") {
    return {
      width: pageSize.width,
      height: documentData.regions?.header?.height ?? 96,
    };
  }
  if (region === "footer") {
    return {
      width: pageSize.width,
      height: documentData.regions?.footer?.height ?? 96,
    };
  }
  return pageSize;
}
