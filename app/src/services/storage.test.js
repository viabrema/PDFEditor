import { describe, expect, it } from "vitest";
import { createDocument } from "../editor/documentModel.js";
import { createStorageService } from "./storage.js";

describe("storage service", () => {
  it("requires adapter functions", () => {
    expect(() => createStorageService()).toThrow(/adapter/);
  });

  it("saves and loads documents", async () => {
    const store = new Map();
    const adapter = {
      async writeFile(path, contents) {
        store.set(path, contents);
      },
      async readFile(path) {
        return store.get(path);
      },
    };

    const service = createStorageService(adapter);
    const document = createDocument({ id: "doc-1" });

    await service.saveDocument(document, "doc.json");
    const loaded = await service.loadDocument("doc.json");

    expect(loaded).toEqual(document);
  });
});
