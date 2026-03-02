import { Schema } from "prosemirror-model";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { addListNodes } from "prosemirror-schema-list";

const chartNode = {
  attrs: {
    type: { default: "bar" },
    data: { default: null },
  },
  group: "block",
  atom: true,
  selectable: true,
  parseDOM: [
    {
      tag: "div[data-chart]",
      getAttrs: (dom) => ({
        type: dom.getAttribute("data-chart") || "bar",
        data: dom.getAttribute("data-chart-data") || null,
      }),
    },
  ],
  toDOM: (node) => [
    "div",
    {
      "data-chart": node.attrs.type,
      "data-chart-data": node.attrs.data || "",
      class: "pm-chart",
    },
    "Chart",
  ],
};

export function createEditorSchema() {
  const nodes = addListNodes(basicSchema.spec.nodes, "paragraph block*", "block");
  const extendedNodes = nodes.addToEnd("chart", chartNode);
  return new Schema({ nodes: extendedNodes, marks: basicSchema.spec.marks });
}
