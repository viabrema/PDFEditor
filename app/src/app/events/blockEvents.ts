import { createBlock, BLOCK_TYPES } from "../../blocks/blockModel";
import { createImageBlockFromFile } from "../../blocks/imageBlock";
import { createTableBlockFromRows, createTableBlockFromText, parseTabularText } from "../../blocks/tableBlock";
import { getBlockInsertionRegionContext } from "../blockInsertionContext";
import { getNextBlockPosition } from "../textUtils";
import { setLastAction } from "../activityLog";

export function bindBlockEvents({ documentData, state, blocks, refs, renderer }) {
  function getRegionContext() {
    return getBlockInsertionRegionContext({ documentData, state, blocks });
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
        type: BLOCK_TYPES.TEXT,
        position,
        size: blockSize,
        pageId: isBody ? state.activePageId : null,
        languageId: state.activeLanguageId,
        metadata: isBody ? {} : { region },
      })
    );
    setLastAction(state, "Bloco de texto adicionado.");
    renderer.renderCanvas();
  });

  refs.addHeadingButton.addEventListener("click", () => {
    const { region, isBody, blocksForRegion, regionSize } = getRegionContext();
    const blockSize = { width: 520, height: 120 };
    const position = getNextBlockPosition({
      blocksForPage: blocksForRegion,
      blockSize,
      pageSize: regionSize,
    });

    blocks.push(
      createBlock({
        type: BLOCK_TYPES.HEADING,
        position,
        size: blockSize,
        pageId: isBody ? state.activePageId : null,
        languageId: state.activeLanguageId,
        metadata: isBody ? { headingLevel: 1 } : { region, headingLevel: 1 },
      })
    );
    setLastAction(state, "Bloco de titulo adicionado.");
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
    setLastAction(state, "Tabela adicionada.");
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
    setLastAction(state, "Imagem adicionada.");
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
      setLastAction(state, "Tabela criada a partir da area de transferencia.");
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
    setLastAction(state, "Imagem colada.");
    renderer.renderCanvas();
  });
}
