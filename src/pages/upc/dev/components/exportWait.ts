// Utils
import { missingFrom } from "../coverage";

// Interfaces
import type { ExportWaitInput } from "../interfaces";

const READY = " Download is ready once it has.";

const upcCount = (n: number) => `${n} UPC${n === 1 ? "" : "s"}`;

/**
 * Why Download has to wait, or null when the file would hold what the screen
 * shows: it waits until every UPC the file would hold has loaded for that tab,
 * so a still-loading or failed tab never exports blanks.
 */
export const exportWaitReason = (p: ExportWaitInput): string | null => {
  const selected = new Set(p.selectedUpcs);
  const nothingSelected = p.selectedUpcs.length === 0;
  // The UPCs the file would hold: every searched UPC, or the ticked ones.
  const inFile = (all: boolean) => p.searchedUpcs.filter((u) => all || selected.has(u));
  const unloaded = (codes: string[], coverage: string[], what: string) => {
    const n = missingFrom(codes, coverage).length;
    return n ? `${what} hasn't loaded for ${upcCount(n)} yet.${READY}` : null;
  };

  switch (p.tab) {
    case "salesComp": {
      const waiting = unloaded(inFile(p.preset === "all"), p.salesCompCoverage, "Sales Comp");
      if (waiting) return waiting;
      // Last year can fail and leave the summary on this year alone, as the
      // screen does; it only has to have finished.
      if (p.shape === "summary" && p.salesCompLYLoading) return `Last year is still loading.${READY}`;
      return null;
    }
    case "priceOpt":
      return unloaded(inFile(p.preset === "all"), p.priceOptCoverage, "Price Opt");
    case "movement":
      return unloaded(inFile(p.preset === "all"), p.movementCoverage, "Movement");
    case "trend":
      // Every Trend preset is a filter over the ticked UPCs.
      if (nothingSelected) return "No UPCs selected.";
      return unloaded(inFile(false), p.trendCoverage, "Trend");
    case "association":
      if (nothingSelected) return "No UPCs selected.";
      if (p.associationSeedError) return `Associations didn't load: ${p.associationSeedError}.`;
      if (!p.associationSeedReady) return `Associations are still loading.${READY}`;
      if (p.associationRerootUpc && !p.associationRerootLoaded) {
        return `Associations for ${p.associationRerootUpc} are still loading.${READY}`;
      }
      return null;
    default:
      return null;
  }
};
