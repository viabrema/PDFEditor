import { describe, expect, it } from "vitest";
import { createEditorSchema } from "./schema.js";

describe("editor schema", () => {
  it("creates schema with chart node", () => {
    const schema = createEditorSchema();

    expect(schema.nodes.chart).toBeTruthy();
    expect(schema.nodes.image).toBeTruthy();
    expect(schema.marks.strong).toBeTruthy();
  });

  it("serializes chart node", () => {
    const schema = createEditorSchema();
    const node = schema.nodes.chart.create({ type: "line" });
    const domSpec = node.type.spec.toDOM(node);

    expect(domSpec[1]["data-chart"]).toBe("line");
  });

  it("parses chart DOM attrs", () => {
    const schema = createEditorSchema();
    const element = globalThis.document
      ? globalThis.document.createElement("div")
      : {
          getAttribute(name) {
            if (name === "data-chart") {
              return "pie";
            }
            if (name === "data-chart-data") {
              return "sample";
            }
            return null;
          },
        };

    element.setAttribute?.("data-chart", "pie");
    element.setAttribute?.("data-chart-data", "sample");

    const attrs = schema.nodes.chart.spec.parseDOM[0].getAttrs(element);

    expect(attrs).toEqual({ type: "pie", data: "sample" });
  });

  it("uses defaults when attrs are missing", () => {
    const schema = createEditorSchema();
    const element = {
      getAttribute() {
        return null;
      },
    };

    const attrs = schema.nodes.chart.spec.parseDOM[0].getAttrs(element);

    expect(attrs).toEqual({ type: "bar", data: null });
  });
});
