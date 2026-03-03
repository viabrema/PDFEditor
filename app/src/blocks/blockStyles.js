import { BLOCK_TYPES } from "./blockModel.js";

const DEFAULT_STYLES = {
  [BLOCK_TYPES.TITLE]: {
    fontSize: "26px",
    fontWeight: "700",
    color: "#008737",
  },
  [BLOCK_TYPES.SUBTITLE]: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
  },
  [BLOCK_TYPES.TEXT]: {
    fontSize: "16px",
    fontWeight: "400",
    color: "#0f172a",
  },
};

export function getBlockDefaultStyle(type) {
  return DEFAULT_STYLES[type] || DEFAULT_STYLES[BLOCK_TYPES.TEXT];
}

export function getBlockTextStyle(block) {
  const defaults = getBlockDefaultStyle(block.type);
  return {
    fontSize: block.metadata?.fontSize || defaults.fontSize,
    fontFamily: block.metadata?.fontFamily || "",
    fontWeight: defaults.fontWeight,
    color: defaults.color,
    textAlign: block.metadata?.align || "left",
  };
}
