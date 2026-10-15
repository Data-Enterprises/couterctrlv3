import type { SkippedUser } from "../../../../api/storeAccess";

/**
 * Turning one store-assignment call into one sentence.
 *
 * Both endpoints return `changed` and `skipped` rather than a count, because
 * here the partial result is the ordinary one: unassigning refuses anybody who
 * holds the store through a base group, and that refusal is the point rather
 * than an error. A count would say four of seven and leave the reader to
 * guess which three and why — when what they need is the name of the group to
 * go and change.
 */

export interface StoreUserResult {
  changed: number[];
  skipped: SkippedUser[];
}

export interface Summary {
  tone: "success" | "error";
  text: string;
}

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
 * What the row's `via` should say.
 *
 * `direct` is deliberately a word rather than a blank: a blank reads as
 * missing data, and this is the opposite — the most durable kind of grant
 * there is, the one no group can take back.
 */
export const viaLabel = (via: string | null): string =>
  via === null || via === "" ? "direct" : via;
