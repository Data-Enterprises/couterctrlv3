// Utils
import { missingFrom } from "../coverage";

// Interfaces
import type { UpcDevTab } from "../../../../features/dev/devUpcDevSlice";

/** What the export needs to know about the page to say whether it can run. */
export interface ExportWaitInput {
  tab: UpcDevTab;
  preset: string;
  /** Sales Comp only: "summary" carries last year's columns, "detail" doesn't. */
  shape: "summary" | "detail";
  searchedUpcs: string[];
  selectedUpcs: string[];
  salesCompCoverage: string[];
  salesCompLYLoading: boolean;
  priceOptCoverage: string[];
  trendCoverage: string[];
  movementCoverage: string[];
  /** The seed answer on hand is for the UPCs ticked now. */
  associationSeedReady: boolean;
  associationSeedError: string | null;
  associationRerootUpc: string | null;
  associationRerootLoaded: boolean;
}

const READY = " Download is ready once it has.";

const upcCount = (n: number) => `${n} UPC${n === 1 ? "" : "s"}`;

/**
 * Why Download has to wait, or null when the file would hold what the screen
 * shows.
 *
 * The export writes whatever the tab holds. Clicked while a tab is still
 * loading, or after its call failed, that was a CSV of headers only -- or for
 * Movement, rows of blanks that read like nothing sold -- and the window closed
 * as if it had worked. So Download waits until every UPC the file would hold
 * has loaded for that tab.
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
