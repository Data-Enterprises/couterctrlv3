// Interfaces
import type { MembershipSummary, StoreOutcome } from "../interfaces";

/**
 * Moving stores in and out of a base group, and saying what it did.
 *
 * - **`granted_to_users`** is the people holding the group as `all`: the same
 *   on every call in a fan-out, so it is taken once, never summed.
 * - **`revoked_from_users`** is the people who lost that store: it sums, but
 *   to grants removed, not people, and the wording says so.
 */

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
 * The reason out of a failed call. The company guard answers 400 with FastAPI's
 * `detail`, so axios throws and the message is read from there.
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
