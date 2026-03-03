import { BLOCK_TYPES } from "./blockModel.js";

const DEFAULT_TEXT_STYLE = {
  fontSize: "16px",
  fontWeight: "400",
  color: "#0f172a",
};

const HEADING_LEVEL_STYLES = {
  1: { fontSize: "26px", fontWeight: "700", color: "#008737" },
  2: { fontSize: "18px", fontWeight: "700", color: "#0f172a" },
  3: { fontSize: "16px", fontWeight: "600", color: "#0f172a" },
};

function getHeadingLevel(block) {
  const rawLevel =
    block.type === BLOCK_TYPES.TITLE
      ? 1
      : block.type === BLOCK_TYPES.SUBTITLE
        ? 2
        : block.metadata?.headingLevel ?? block.metadata?.level;
  const level = Number(rawLevel) || 1;
  return Math.min(3, Math.max(1, level));
}

export function getBlockDefaultStyle(type) {
  if (type === BLOCK_TYPES.HEADING) {
    return HEADING_LEVEL_STYLES[1];
  }
  if (type === BLOCK_TYPES.TITLE) {
    return HEADING_LEVEL_STYLES[1];
  }
  if (type === BLOCK_TYPES.SUBTITLE) {
    return HEADING_LEVEL_STYLES[2];
  }
  return DEFAULT_TEXT_STYLE;
}

export function getBlockTextStyle(block) {
  let defaults = getBlockDefaultStyle(block.type);
  if (
    block.type === BLOCK_TYPES.HEADING ||
    block.type === BLOCK_TYPES.TITLE ||
    block.type === BLOCK_TYPES.SUBTITLE
  ) {
    const level = getHeadingLevel(block);
    defaults = HEADING_LEVEL_STYLES[level];
  }
  return {
    fontSize: block.metadata?.fontSize || defaults.fontSize,
    fontFamily: block.metadata?.fontFamily || "",
    fontWeight: defaults.fontWeight,
    color: defaults.color,
    textAlign: block.metadata?.align || "left",
  };
}
