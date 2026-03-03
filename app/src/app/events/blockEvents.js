import { createBlock } from "../../blocks/blockModel.js";
import { createImageBlockFromFile } from "../../blocks/imageBlock.js";
import { createTableBlockFromRows, createTableBlockFromText, parseTabularText } from "../../blocks/tableBlock.js";
import { getNextBlockPosition, getPageSize, getRegionSize } from "../textUtils.js";

export function bindBlockEvents({ documentData, state, blocks, refs, renderer }) {
  function getRegionContext() {
    const region = state.activeRegion || "body";
    const isBody = region === "body";
    const blocksForRegion = blocks.filter((block) => {
      const matchesLanguage = block.languageId === state.activeLanguageId;
      if (!matchesLanguage) {
        return false;
      }
      if (isBody) {
        return (
          block.pageId === state.activePageId &&
          block.metadata?.region !== "header" &&
          block.metadata?.region !== "footer"
        );
      }
      return block.metadata?.region === region;
    });

    const regionSize = isBody
      ? getPageSize(documentData.page.format, documentData.page.orientation)
      : getRegionSize({ documentData, region });

    return { region, isBody, blocksForRegion, regionSize };
  }

  refs.addTextButton.addEventListener("click", () => {
    const { region, isBody, blocksForRegion, regionSize } = getRegionContext();
    const blockSize = { width: 520, height: 220 };
    const position = getNextBlockPosition({
      blocksForPage: blocksForRegion,
      blockSize,
      pageSize: regionSize,
    });

    blocks.push(
      createBlock({
        position,
        size: blockSize,
        pageId: isBody ? state.activePageId : null,
        languageId: state.activeLanguageId,
        metadata: isBody ? {} : { region },
      })
    );
    renderer.renderCanvas();
  });

  refs.addTableButton.addEventListener("click", () => {
    const { region, isBody, blocksForRegion, regionSize } = getRegionContext();
    const position = getNextBlockPosition({
      blocksForPage: blocksForRegion,
      blockSize: { width: 520, height: 220 },
      pageSize: regionSize,
    });

    const tableBlock = createTableBlockFromRows([
      ["", ""],
      ["", ""],
    ], {
      pageId: isBody ? state.activePageId : null,
      languageId: state.activeLanguageId,
      position,
      pageSize: regionSize,
      metadata: isBody ? {} : { region },
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

    const { region, isBody, blocksForRegion, regionSize } = getRegionContext();
    const position = getNextBlockPosition({
      blocksForPage: blocksForRegion,
      blockSize: { width: 520, height: 360 },
      pageSize: regionSize,
    });

    const block = await createImageBlockFromFile(file, {
      pageId: isBody ? state.activePageId : null,
      languageId: state.activeLanguageId,
      position,
      pageSize: regionSize,
      metadata: isBody ? {} : { region },
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

      const { region, isBody, blocksForRegion, regionSize } = getRegionContext();
      const position = getNextBlockPosition({
        blocksForPage: blocksForRegion,
        blockSize: { width: 520, height: 220 },
        pageSize: regionSize,
      });

      const tableBlock = createTableBlockFromText(text, {
        pageId: isBody ? state.activePageId : null,
        languageId: state.activeLanguageId,
        position,
        pageSize: regionSize,
        metadata: isBody ? {} : { region },
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

    const { region, isBody, blocksForRegion, regionSize } = getRegionContext();
    const position = getNextBlockPosition({
      blocksForPage: blocksForRegion,
      blockSize: { width: 520, height: 360 },
      pageSize: regionSize,
    });

    const block = await createImageBlockFromFile(file, {
      pageId: isBody ? state.activePageId : null,
      languageId: state.activeLanguageId,
      position,
      pageSize: regionSize,
      metadata: isBody ? {} : { region },
    });

    blocks.push(block);
    renderer.renderCanvas();
  });
}
