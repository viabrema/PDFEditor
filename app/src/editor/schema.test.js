import { describe, expect, it } from "vitest";
import { createEditorSchema } from "./schema.js";

describe("editor schema", () => {
  it("creates schema with chart node", () => {
    const schema = createEditorSchema();

    expect(schema.nodes.chart).toBeTruthy();
    expect(schema.nodes.image).toBeTruthy();
    expect(schema.marks.strong).toBeTruthy();
    expect(schema.marks.textStyle).toBeTruthy();
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

  it("serializes text style mark", () => {
    const schema = createEditorSchema();
    const mark = schema.marks.textStyle.create({ fontSize: "16px", fontFamily: "Georgia" });
    const domSpec = mark.type.spec.toDOM(mark);

    expect(domSpec[1].style).toContain("font-size: 16px");
    expect(domSpec[1].style).toContain("font-family: Georgia");
  });

  it("serializes text style mark with single attr", () => {
    const schema = createEditorSchema();
    const mark = schema.marks.textStyle.create({ fontSize: "12px" });
    const domSpec = mark.type.spec.toDOM(mark);

    expect(domSpec[1].style).toContain("font-size: 12px");
  });

  it("serializes text style mark with font family", () => {
    const schema = createEditorSchema();
    const mark = schema.marks.textStyle.create({ fontFamily: "Arial" });
    const domSpec = mark.type.spec.toDOM(mark);

    expect(domSpec[1].style).toContain("font-family: Arial");
  });

  it("serializes text style mark with empty attrs", () => {
    const schema = createEditorSchema();
    const mark = schema.marks.textStyle.create({});
    const domSpec = mark.type.spec.toDOM(mark);

    expect(domSpec[1]).toEqual({});
  });

  it("ignores text style mark without attrs", () => {
    const schema = createEditorSchema();
    const element = {
      style: {},
    };

    const attrs = schema.marks.textStyle.spec.parseDOM[0].getAttrs(element);

    expect(attrs).toBe(false);
  });

  it("parses text style mark from DOM", () => {
    const schema = createEditorSchema();
    const element = {
      style: { fontFamily: "Georgia" },
    };

    const attrs = schema.marks.textStyle.spec.parseDOM[0].getAttrs(element);

    expect(attrs).toEqual({ fontSize: null, fontFamily: "Georgia" });
  });
});
