import { describe, expect, it } from "vitest";

/**
 * State kept outside Redux survives sign-out.
 *
 * Sign-out empties the store (see `rootReducer` and signOutReset.test.ts),
 * and every slice registered in it is covered without anyone remembering to.
 * A variable at the top of a module is not: it lives as long as the tab, so
 * the next person to sign in on the same browser inherits whatever the last
 * one left in it.
 *
 * So each one is listed here with why it is safe, and a new one fails this
 * test until somebody decides. The fix is usually to keep it in a slice. If
 * it really belongs in the module, add it below with the reason.
 */

/** `file:name`, and why it may outlive a session. */
const ALLOWED: Record<string, string> = {
  "components-dev/scanner/useScanGun.ts:modelLookup":
    "the device's model name, not anybody's data",
  "pages/inventory/dev/ItemAnalysisPanel.tsx:NO_ROWS":
    "a shared empty array, never written to",
  "pages/sales/dev/components/PopupSubDeptList.tsx:inFlightItems":
    "keys of requests still on the wire, emptied as each one lands",
  "pages/sales/dev/components/PopupTopItems.tsx:inFlight":
    "keys of requests still on the wire, emptied as each one lands",
  "pages/sales/dev/components/StoreDetailPopup.tsx:inFlightStores":
    "keys of requests still on the wire, emptied as each one lands",
  "pages/upcScanner/dev/useScanResolve.ts:inFlight":
    "keys of requests still on the wire, emptied as each one lands",
  "features/ticketsMockData.ts:MOCK_ATTACHMENTS":
    "an empty mock list in a file nothing imports",
  "pages/vendors/dev/useVendorSearch.ts:searchSeq":
    "a counter that drops a search's late answers; it holds no data",
  "utils/pageCalls.ts:armed":
    "whether the call recorder is installed, once per tab",
  "utils/pageCalls.ts:calls":
    "Report an issue's evidence, cleared on every route change, and sign-out changes the route",
  "utils/sessionGuard.ts:pendingReason":
    "why the session ended, carried to the sign-in screen on purpose",
};

const files = import.meta.glob(
  ["../**/*.{ts,tsx}", "!../**/*.test.{ts,tsx}", "!../**/*.d.ts", "!../legacy/**"],
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

/**
 * Top-level bindings that can be written to: any `let`, and a `const` that
 * starts out as an empty Map, Set, array or object. A const built from values
 * (a lookup table) is left alone; one that starts empty exists to be filled.
 */
const MUTABLE = [
  /^(?:export\s+)?let\s+([A-Za-z_$][\w$]*)/,
  /^(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*(?:new\s+(?:Map|Set|WeakMap)(?:<[^>]*>)?\(\s*\)|\[\]|\{\})\s*;/,
];

const found = Object.entries(files).flatMap(([path, source]) =>
  source.split("\n").flatMap((line) =>
    MUTABLE.map((re) => line.match(re)?.[1])
      .filter((name): name is string => !!name)
      .map((name) => `${path.replace(/^\.\.\//, "")}:${name}`),
  ),
);

describe("module-level state", () => {
  it("reads the source it is meant to", () => {
    expect(Object.keys(files).length).toBeGreaterThan(200);
  });

  it("has nothing new that would outlive a sign-out", () => {
    // A failure here names the variable. Move it into a slice, or add it to
    // ALLOWED with the reason it is safe for the next person to inherit.
    expect(found.filter((key) => !(key in ALLOWED))).toEqual([]);
  });

  it("lists nothing that is no longer there", () => {
    expect(Object.keys(ALLOWED).filter((key) => !found.includes(key))).toEqual(
      [],
    );
  });
});
