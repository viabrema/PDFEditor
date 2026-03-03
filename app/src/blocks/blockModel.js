import { createId } from "../utils/id.js";

export const BLOCK_TYPES = {
  TEXT: "text",
  HEADING: "heading",
  TITLE: "title",
  SUBTITLE: "subtitle",
  IMAGE: "image",
  TABLE: "table",
  CHART: "chart",
};

export function createBlock({
  id = createId("block"),
  type = BLOCK_TYPES.TEXT,
  content = "",
  position = {},
  size = {},
  metadata = {},
  pageId = null,
  languageId = null,
} = {}) {
  return {
    id,
    type,
    content,
    position: {
      x: position.x ?? 0,
      y: position.y ?? 0,
    },
    size: {
      width: size.width ?? 240,
      height: size.height ?? 120,
    },
    metadata,
    pageId,
    languageId,
  };
}
