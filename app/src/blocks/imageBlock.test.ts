import { describe, expect, it, vi } from "vitest";
import {
  createImageBlockFromFile,
  fileToDataUrl,
  getImageDimensions,
  scaleToFit,
} from "./imageBlock";

function createMockReader({ result, error } = {}) {
  return () => ({
    result,
    error,
    readAsDataURL: vi.fn(function () {
      if (error) {
        this.onerror();
      } else {
        this.onload();
      }
    }),
    onload: null,
    onerror: null,
  });
}

function createMockImage({ width = 640, height = 480, shouldError = false } = {}) {
  return () => ({
    width,
    height,
    onload: null,
    onerror: null,
    set src(value) {
      if (shouldError) {
        this.onerror();
      } else {
        this.onload();
      }
      this._src = value;
    },
  });
}

describe("image block", () => {
  it("reads file as data url", async () => {
    const readerFactory = createMockReader({ result: "data:image/png;base64,abc" });
    const dataUrl = await fileToDataUrl({}, readerFactory);

    expect(dataUrl).toBe("data:image/png;base64,abc");
  });

  it("reads file with global FileReader", async () => {
    const originalFileReader = globalThis.FileReader;
    globalThis.FileReader = function FileReader() {
      this.result = "data:image/png;base64,global";
      this.readAsDataURL = () => {
        this.onload();
      };
    };

    try {
      const dataUrl = await fileToDataUrl({});
      expect(dataUrl).toBe("data:image/png;base64,global");
    } finally {
      globalThis.FileReader = originalFileReader;
    }
  });

  it("rejects when reader errors", async () => {
    const readerFactory = createMockReader({ error: new Error("boom") });
    await expect(fileToDataUrl({}, readerFactory)).rejects.toThrow(/boom/);
  });

  it("rejects when reader has no error", async () => {
    const readerFactory = () => ({
      error: null,
      readAsDataURL: vi.fn(function () {
        this.onerror();
      }),
      onload: null,
      onerror: null,
    });

    await expect(fileToDataUrl({}, readerFactory)).rejects.toThrow(
      /Failed to read file/
    );
  });

  it("gets image dimensions", async () => {
    const imageFactory = createMockImage({ width: 300, height: 200 });
    const dimensions = await getImageDimensions("data:image/png", imageFactory);

    expect(dimensions).toEqual({ width: 300, height: 200 });
  });

  it("gets image dimensions with global Image", async () => {
    const originalImage = globalThis.Image;
    globalThis.Image = function Image() {
      this.width = 120;
      this.height = 80;
      Object.defineProperty(this, "src", {
        set() {
          this.onload();
        },
      });
    };

    try {
      const dimensions = await getImageDimensions("data:image/png");
      expect(dimensions).toEqual({ width: 120, height: 80 });
    } finally {
      globalThis.Image = originalImage;
    }
  });

  it("rejects when image fails", async () => {
    const imageFactory = createMockImage({ shouldError: true });
    await expect(getImageDimensions("data:image/png", imageFactory)).rejects.toThrow(
      /Failed to load image/
    );
  });

  it("scales within bounds", () => {
    const size = scaleToFit({ width: 1000, height: 500 }, { maxWidth: 500, maxHeight: 300 });

    expect(size).toEqual({ width: 500, height: 250 });
  });

  it("uses fallback size for invalid dimensions", () => {
    const size = scaleToFit({ width: 0, height: 0 }, { maxWidth: 400, maxHeight: 300 });

    expect(size).toEqual({ width: 400, height: 300 });
  });

  it("creates image block", async () => {
    const readerFactory = createMockReader({ result: "data:image/png;base64,abc" });
    const imageFactory = createMockImage({ width: 800, height: 600 });

    const block = await createImageBlockFromFile(
      {},
      {
        pageId: "page-1",
        languageId: "lang-pt",
        pageSize: { width: 800, height: 600 },
        readerFactory,
        imageFactory,
      }
    );

    expect(block.type).toBe("image");
    expect(block.content.src).toContain("data:image/png");
  });

  it("uses page size fallback when max size is not provided", async () => {
    const readerFactory = createMockReader({ result: "data:image/png;base64,abc" });
    const imageFactory = createMockImage({ width: 2000, height: 2000 });

    const block = await createImageBlockFromFile(
      {},
      {
        pageId: "page-1",
        languageId: "lang-pt",
        pageSize: { width: 600, height: 400 },
        readerFactory,
        imageFactory,
      }
    );

    expect(block.size).toEqual({ width: 336, height: 336 });
  });

  it("uses default fallback when page size is missing", async () => {
    const readerFactory = createMockReader({ result: "data:image/png;base64,abc" });
    const imageFactory = createMockImage({ width: 2000, height: 1000 });

    const block = await createImageBlockFromFile(
      {},
      {
        pageId: "page-1",
        languageId: "lang-pt",
        readerFactory,
        imageFactory,
      }
    );

    expect(block.size).toEqual({ width: 520, height: 260 });
  });

  it("falls back to max size when image load fails", async () => {
    const readerFactory = createMockReader({ result: "data:image/png;base64,abc" });
    const imageFactory = createMockImage({ shouldError: true });

    const block = await createImageBlockFromFile(
      {},
      {
        pageId: "page-1",
        languageId: "lang-pt",
        maxSize: { width: 300, height: 200 },
        readerFactory,
        imageFactory,
      }
    );

    expect(block.size).toEqual({ width: 300, height: 200 });
  });
});
