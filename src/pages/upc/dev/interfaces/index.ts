// Interfaces
import type { UpcDevTab } from "../../../../features/dev/devUpcDevSlice";

/** Authored in `src/components/KpiTileGrid.tsx`, beside the component that
 *  consumes it. Re-exported here so existing imports keep working. */
export type { KpiCell } from "../../../../components-dev/KpiTileGrid";

export type CtaTone = "up" | "down" | "flat" | "muted";

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

export type HeatStyle = { bg: string; color: string };

/**
 * What a marketing/* answer says about the UPCs it was asked for.
 *
 * Those endpoints answer `error: 1` both when they failed and when the UPCs
 * simply sold nothing in the window: "No data was returned." comes back with
 * `success: true`, a real failure with `success: false`. Only a failure should
 * leave the UPCs unfetched. An empty answer is still an answer and covers
 * them; treating it as a failure meant every visit to the tab asked again,
 * warned again, and paid for the call again.
 */
export type UpcAnswer = "ok" | "empty" | "failed";
