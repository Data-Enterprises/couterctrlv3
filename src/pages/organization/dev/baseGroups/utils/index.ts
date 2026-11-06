/**
 * Moving stores in and out of a base group, and saying what it did.
 *
 * The dual list hands over a whole selection; the endpoints take one store at
 * a time. So this fans out, and then has to turn N results into one sentence —
 * which is where the care is, because the two endpoints count different
 * things and summing both the same way would misreport one of them.
 *
 * - **`granted_to_users`** is the number of people holding the *group* as
 *   `all`. It is the same number on every call in a fan-out, so it is taken
 *   once. Summed, four stores into a group with twelve auto holders would
 *   claim forty-eight people gained access.
 * - **`revoked_from_users`** is the number of people who lost *that store*.
 *   Different per store, so it sums — but what it sums to is grants removed,
 *   not people, and a person losing three stores counts three times. The
 *   wording has to say so.
 */

/** What one store's call came back with. */
export type StoreOutcome =
  | {
      storeid: number;
      ok: true;
      /** Auto holders of the group. Identical across a fan-out. */
      granted?: number;
      /** Single-store users the server refused to widen. */
      skippedSingleStore?: number;
      /** Grants removed for this store. */
      revoked?: number;
    }
  | { storeid: number; ok: false; reason: string };

export interface MembershipSummary {
  tone: "success" | "error";
  text: string;
  /** Stores whose call came back clean. */
  ok: number;
  failed: number;
}

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;

/** The first reason given, for a fan-out where every store failed the same
 *  way — a cross-company selection being the case that actually happens. */
const firstReason = (outcomes: StoreOutcome[]) =>
  outcomes.find((o): o is Extract<StoreOutcome, { ok: false }> => !o.ok)
    ?.reason ?? "";

export const summarizeAssign = (
  outcomes: StoreOutcome[],
  groupName: string,
): MembershipSummary => {
  const done = outcomes.filter((o) => o.ok);
  const failed = outcomes.filter((o) => !o.ok);

  if (done.length === 0) {
    return {
      tone: "error",
      text: `No stores were added to ${groupName}. ${firstReason(outcomes)}`.trim(),
      ok: 0,
      failed: failed.length,
    };
  }

  // Taken, not summed — see the note at the top of the file.
  const granted = Math.max(
    0,
    ...done.map((o) => (o.ok ? (o.granted ?? 0) : 0)),
  );
  const skipped = Math.max(
    0,
    ...done.map((o) => (o.ok ? (o.skippedSingleStore ?? 0) : 0)),
  );

  const gained =
    granted > 0
      ? ` ${plural(granted, "user")} with automatic access gained ${
          done.length === 1 ? "it" : "them"
        }.`
      : " Nobody holds this group automatically, so no access changed.";

  const skippedNote =
    skipped > 0
      ? ` ${plural(skipped, "single-store user")} skipped.`
      : "";

  const failedNote =
    failed.length > 0 ? ` ${failed.length} could not be added.` : "";

  return {
    tone: failed.length > 0 ? "error" : "success",
    text: `${plural(done.length, "store")} added to ${groupName}.${gained}${skippedNote}${failedNote}`,
    ok: done.length,
    failed: failed.length,
  };
};

export const summarizeUnassign = (
  outcomes: StoreOutcome[],
  groupName: string,
): MembershipSummary => {
  const done = outcomes.filter((o) => o.ok);
  const failed = outcomes.filter((o) => !o.ok);

  if (done.length === 0) {
    return {
      tone: "error",
      text: `No stores were removed from ${groupName}. ${firstReason(outcomes)}`.trim(),
      ok: 0,
      failed: failed.length,
    };
  }

  // Summed, because each store's revocations are its own. "Grants", not
  // "users": one person losing three stores is three of these.
  const revoked = done.reduce(
    (sum, o) => sum + (o.ok ? (o.revoked ?? 0) : 0),
    0,
  );

  const lost =
    revoked > 0
      ? ` ${plural(revoked, "store grant")} revoked.`
      : " Nobody lost access — everyone who had these stores still reaches them another way.";

  const failedNote =
    failed.length > 0 ? ` ${failed.length} could not be removed.` : "";

  return {
    tone: failed.length > 0 ? "error" : "success",
    text: `${plural(done.length, "store")} removed from ${groupName}.${lost}${failedNote}`,
    ok: done.length,
    failed: failed.length,
  };
};

/**
 * The reason out of a failed call.
 *
 * The company guard answers 400 with FastAPI's `detail`, not a body with
 * `error: 1`, so axios throws and the message never reaches a `.then`. Reading
 * only `err.message` there would report "Request failed with status code 400"
 * to somebody who needs to be told the store is in another company.
 */
export const callReason = (err: unknown): string => {
  const e = err as {
    response?: { data?: { detail?: string; msg?: string } };
    message?: string;
  };
  return (
    e.response?.data?.detail ??
    e.response?.data?.msg ??
    e.message ??
    "The server refused it."
  );
};
