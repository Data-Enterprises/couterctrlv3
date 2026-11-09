// Interfaces
import type { ExplorerOutcome } from "../interfaces";

/** What the phone says when a search finds nothing or fails. */
export const NOTICES: Partial<Record<ExplorerOutcome, string>> = {
  empty:
    "Nothing found for that search — try a different store, group, or week.",
  error: "Couldn't load that search. Check your connection and try again.",
};

/**
 * Neutral fills: spread is a classification, not a verdict, so no red/amber/
 * green. `unmapped` is navy, the page's emphasis.
 */
export const SPREAD_CLASS: Record<string, string> = {
  single: "bg-gray-100 text-content border-brand_line",
  narrow: "bg-gray-100 text-content border-brand_line",
  wide: "bg-brand_navy/10 text-brand_navy border-brand_navy/20",
  unmapped: "bg-brand_navy/10 text-brand_navy border-brand_navy/20",
};
