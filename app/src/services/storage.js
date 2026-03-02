import { deserializeDocument, serializeDocument } from "../editor/documentModel.js";

export function createStorageService(adapter) {
  if (!adapter || typeof adapter.readFile !== "function" || typeof adapter.writeFile !== "function") {
    throw new Error("Storage adapter must provide readFile and writeFile functions.");
  }

  return {
    async saveDocument(document, path) {
      const payload = serializeDocument(document);
      await adapter.writeFile(path, payload);
    },
    async loadDocument(path) {
      const payload = await adapter.readFile(path);
      return deserializeDocument(payload);
    },
  };
}
