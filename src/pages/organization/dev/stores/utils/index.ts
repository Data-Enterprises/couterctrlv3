// Utils
import { rowsToCsv } from "../../../../../utils/csvExport";

// Interfaces
import type { StoreUserResult, Summary } from "../interfaces";
import type { SkippedUser } from "../../../../../api/storeAccess";
import type { Store } from "../../../../../interfaces";

/**
 * Turning one store-assignment call into one sentence. Partial results are
 * normal here (unassigning refuses base-group holders), so the summary names
 * the groups to change rather than giving a count.
 */

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;

/** The groups named in a set of refusals, in first-seen order and without
 *  repeats — a dozen users refused by one group should read as one group. */
export const groupsNamed = (skipped: SkippedUser[]): string[] =>
  Array.from(
    new Set(
      skipped
        .map((s) => s.via)
        .filter((via): via is string => typeof via === "string" && via !== ""),
    ),
  );

/** "Zone 1", "Zone 1 and East", "Zone 1, East and HC North". */
export const listNames = (names: string[]): string => {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
};

export const summarizeAssign = (
  result: StoreUserResult,
  storeName: string,
): Summary => {
  const done = result.changed.length;
  const skipped = result.skipped.length;

  if (done === 0 && skipped > 0) {
    return {
      tone: "success",
      // Not an error: everyone picked already had it, which is a fine answer
      // to have asked for.
      text: `No change — ${plural(skipped, "user")} already had ${storeName}.`,
    };
  }
  if (done === 0) {
    return { tone: "error", text: `Nobody was given ${storeName}.` };
  }
  return {
    tone: "success",
    text:
      `${plural(done, "user")} given ${storeName}.` +
      (skipped > 0 ? ` ${skipped} already had it.` : ""),
  };
};

export const summarizeUnassign = (
  result: StoreUserResult,
  storeName: string,
): Summary => {
  const done = result.changed.length;
  const kept = result.skipped.length;
  const names = groupsNamed(result.skipped);

  /** The refusal, said as the thing to do about it. */
  const keptNote =
    kept === 0
      ? ""
      : names.length > 0
        ? ` ${plural(kept, "user")} keep it — granted by ${listNames(names)}. Change it on the group.`
        : ` ${plural(kept, "user")} could not be changed.`;

  if (done === 0 && kept > 0) {
    return {
      // Nothing was removed and the reader asked for something — say so in
      // the register that gets read, and name the group.
      tone: "error",
      text: `${storeName} was not removed from anyone.${keptNote}`,
    };
  }
  if (done === 0) {
    return { tone: "error", text: `${storeName} was not removed from anyone.` };
  }
  return {
    tone: kept > 0 ? "error" : "success",
    text: `${storeName} removed from ${plural(done, "user")}.${keptNote}`,
  };
};

/**
 * What the row's `via` says. `direct` is a word, not a blank: it is the grant
 * no group can take back.
 */
export const viaLabel = (via: string | null): string =>
  via === null || via === "" ? "direct" : via;

/** The stores export as CSV. */
export const buildStoresCsv = (stores: Store[], label: string) => {
  const headers = ["Store ID", "Store #", "Store Name", "Company ID", "Company Name"];
  const rows = stores.map((s) => [
    s.storeid,
    s.store_number,
    s.store_name,
    s.company,
    s.company_name,
  ]);
  return `${label}\n${rowsToCsv(headers, rows)}`;
};
