import { getPageSize, getRegionSize } from "./textUtils";
import { effectiveBlockLanguageId } from "./translationFlow";

export function getBlockInsertionRegionContext({ documentData, state, blocks }) {
  const region = state.activeRegion || "body";
  const isBody = region === "body";
  const blocksForRegion = blocks.filter((block) => {
    const matchesLanguage =
      effectiveBlockLanguageId(block, documentData) === state.activeLanguageId;
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
