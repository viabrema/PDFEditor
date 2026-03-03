import { createBlock } from "../../blocks/blockModel.js";
import { createImageBlockFromFile } from "../../blocks/imageBlock.js";
import { createTableBlockFromRows, createTableBlockFromText, parseTabularText } from "../../blocks/tableBlock.js";
import { getNextBlockPosition, getPageSize } from "../textUtils.js";

export function bindBlockEvents({ documentData, state, blocks, refs, renderer }) {
  refs.addTextButton.addEventListener("click", () => {
    const blocksForPage = blocks.filter(
      (block) =>
        block.pageId === state.activePageId &&
        block.languageId === state.activeLanguageId
    );
    const pageSize = getPageSize(
      documentData.page.format,
      documentData.page.orientation
    );
    const blockSize = { width: 520, height: 220 };
    const position = getNextBlockPosition({
      blocksForPage,
      blockSize,
      pageSize,
    });

    blocks.push(
      createBlock({
        position,
        size: blockSize,
        pageId: state.activePageId,
        languageId: state.activeLanguageId,
      })
    );
    renderer.renderCanvas();
  });

  refs.addTableButton.addEventListener("click", () => {
    const blocksForPage = blocks.filter(
      (block) =>
        block.pageId === state.activePageId &&
        block.languageId === state.activeLanguageId
    );
    const pageSize = getPageSize(
      documentData.page.format,
      documentData.page.orientation
    );
    const position = getNextBlockPosition({
      blocksForPage,
      blockSize: { width: 520, height: 220 },
      pageSize,
    });

    const tableBlock = createTableBlockFromRows([
      ["", ""],
      ["", ""],
    ], {
      pageId: state.activePageId,
      languageId: state.activeLanguageId,
      position,
      pageSize,
    });

    blocks.push(tableBlock);
    renderer.renderCanvas();
  });

  refs.addImageButton.addEventListener("click", () => {
    refs.imageInput.click();
  });

  refs.imageInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const blocksForPage = blocks.filter(
      (block) =>
        block.pageId === state.activePageId &&
        block.languageId === state.activeLanguageId
    );
    const pageSize = getPageSize(
      documentData.page.format,
      documentData.page.orientation
    );
    const position = getNextBlockPosition({
      blocksForPage,
      blockSize: { width: 520, height: 360 },
      pageSize,
    });

    const block = await createImageBlockFromFile(file, {
      pageId: state.activePageId,
      languageId: state.activeLanguageId,
      position,
      pageSize,
    });

    blocks.push(block);
    renderer.renderCanvas();
    refs.imageInput.value = "";
  });

  document.addEventListener("paste", async (event) => {
    const items = Array.from(event.clipboardData?.items || []);
    const imageItem = items.find((item) => item.type.startsWith("image/"));
    if (!imageItem) {
      const text = event.clipboardData?.getData("text/plain") || "";
      const rows = parseTabularText(text);
      if (rows.length === 0 || rows.every((row) => row.length <= 1)) {
        return;
      }

      event.preventDefault();

      const blocksForPage = blocks.filter(
        (block) =>
          block.pageId === state.activePageId &&
          block.languageId === state.activeLanguageId
      );
      const pageSize = getPageSize(
        documentData.page.format,
        documentData.page.orientation
      );
      const position = getNextBlockPosition({
        blocksForPage,
        blockSize: { width: 520, height: 220 },
        pageSize,
      });

      const tableBlock = createTableBlockFromText(text, {
        pageId: state.activePageId,
        languageId: state.activeLanguageId,
        position,
        pageSize,
      });

      blocks.push(tableBlock);
      renderer.renderCanvas();
      return;
    }

    const file = imageItem.getAsFile();
    if (!file) {
      return;
    }

    event.preventDefault();

    const blocksForPage = blocks.filter(
      (block) =>
        block.pageId === state.activePageId &&
        block.languageId === state.activeLanguageId
    );
    const pageSize = getPageSize(
      documentData.page.format,
      documentData.page.orientation
    );
    const position = getNextBlockPosition({
      blocksForPage,
      blockSize: { width: 520, height: 360 },
      pageSize,
    });

    const block = await createImageBlockFromFile(file, {
      pageId: state.activePageId,
      languageId: state.activeLanguageId,
      position,
      pageSize,
    });

    blocks.push(block);
    renderer.renderCanvas();
  });
}
