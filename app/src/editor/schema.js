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

const textStyleMark = {
  attrs: {
    fontSize: { default: null },
    fontFamily: { default: null },
  },
  parseDOM: [
    {
      tag: "span",
      getAttrs: (dom) => {
        const fontSize = dom.style?.fontSize || null;
        const fontFamily = dom.style?.fontFamily || null;
        if (!fontSize && !fontFamily) {
          return false;
        }
        return { fontSize, fontFamily };
      },
    },
  ],
  toDOM: (node) => {
    const styleParts = [];
    if (node.attrs.fontSize) {
      styleParts.push(`font-size: ${node.attrs.fontSize}`);
    }
    if (node.attrs.fontFamily) {
      styleParts.push(`font-family: ${node.attrs.fontFamily}`);
    }
    return ["span", styleParts.length ? { style: styleParts.join("; ") } : {}, 0];
  },
};

export function createEditorSchema() {
  const nodes = addListNodes(basicSchema.spec.nodes, "paragraph block*", "block");
  const paragraphSpec = nodes.get("paragraph");
  const headingSpec = nodes.get("heading");

  const paragraphWithAlign = {
    ...paragraphSpec,
    attrs: {
      ...paragraphSpec.attrs,
      textAlign: { default: null },
    },
    parseDOM: [
      {
        tag: "p",
        getAttrs: (dom) => ({ textAlign: dom.style?.textAlign || null }),
      },
    ],
    toDOM: (node) => {
      const attrs = {};
      if (node.attrs.textAlign) {
        attrs.style = `text-align: ${node.attrs.textAlign}`;
      }
      return ["p", attrs, 0];
    },
  };

  const headingWithAlign = {
    ...headingSpec,
    attrs: {
      ...headingSpec.attrs,
      textAlign: { default: null },
    },
    parseDOM: [1, 2, 3, 4, 5, 6].map((level) => ({
      tag: `h${level}`,
      getAttrs: (dom) => ({
        level,
        textAlign: dom.style?.textAlign || null,
      }),
    })),
    toDOM: (node) => {
      const attrs = {};
      if (node.attrs.textAlign) {
        attrs.style = `text-align: ${node.attrs.textAlign}`;
      }
      return [`h${node.attrs.level}`, attrs, 0];
    },
  };

  const alignedNodes = nodes
    .update("paragraph", paragraphWithAlign)
    .update("heading", headingWithAlign);

  const extendedNodes = alignedNodes.addToEnd("chart", chartNode);
  const marks = basicSchema.spec.marks.addToEnd("textStyle", textStyleMark);
  return new Schema({ nodes: extendedNodes, marks });
}
