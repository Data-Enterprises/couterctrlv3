// Interfaces

/** How a run ended. `stale` means a newer run superseded it and nothing it
 *  fetched was applied — the caller should do nothing further either. */
export type ExplorerOutcome = "loaded" | "empty" | "error" | "stale";
