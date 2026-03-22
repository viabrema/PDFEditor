import { createId } from "../utils/id";

export const BLOCK_TYPES = {
  TEXT: "text",
  HEADING: "heading",
  TITLE: "title",
  SUBTITLE: "subtitle",
  IMAGE: "image",
  TABLE: "table",
  LINKED_TABLE: "linkedTable",
  CHART: "chart",
} as const;

export function createBlock(options: any = {}) {
  const {
    id = createId("block"),
    type = BLOCK_TYPES.TEXT,
    content = "",
    position = {},
    size = {},
    metadata = {},
    pageId = null,
    languageId = null,
  } = options;
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
