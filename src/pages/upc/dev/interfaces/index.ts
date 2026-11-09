// Interfaces
import type { UpcDevTab } from "../../../../features/dev/devUpcDevSlice";

/** Authored in `src/components/KpiTileGrid.tsx`, beside the component that
 *  consumes it. Re-exported here so existing imports keep working. */
export type { KpiCell } from "../../../../components-dev/interfaces";

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
 * What a marketing/* answer says about the UPCs asked for. `error: 1` comes
 * back both for failures (`success: false`) and for no sales in the window
 * (`success: true`). Only a failure leaves the UPCs unfetched; an empty answer
 * covers them.
 */
export type UpcAnswer = "ok" | "empty" | "failed";
