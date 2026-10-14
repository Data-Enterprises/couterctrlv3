import type { QuaggaJSResultObject } from "@ericblade/quagga2";

/**
 * The guard against a camera read that fires too early and reads wrong.
 *
 * Quagga reports a decode the moment any frame yields one — including a frame
 * where the barcode is half inside the guide, at an angle, or smeared by
 * motion. Those decodes are where the wrong codes came from. Two checks, the
 * usual pair for Quagga:
 *
 *   1. Quality. Each decoded digit carries an `error` (how far its bars were
 *      from the ideal pattern). A frame whose median error is high is a smudge,
 *      not a read, and is dropped.
 *   2. Agreement. The same code has to come back from CONFIRM_READS frames in
 *      a row. A clean read held in the guide repeats at once; a partial read
 *      off the edge of it doesn't repeat identically.
 *
 * Costs a fraction of a second on a good read — three frames — and is what
 * makes the first read the right one.
 */
export const CONFIRM_READS = 3;
export const MAX_MEDIAN_ERROR = 0.15;

const medianError = (result: QuaggaJSResultObject): number => {
  const errors = (result.codeResult.decodedCodes ?? [])
    .map((d) => (typeof d === "object" && d !== null && "error" in d ? d.error : undefined))
    .filter((e): e is number => typeof e === "number")
    .sort((a, b) => a - b);
  if (!errors.length) return 1;
  const mid = Math.floor(errors.length / 2);
  return errors.length % 2 ? errors[mid] : (errors[mid - 1] + errors[mid]) / 2;
};

/**
 * One per camera session. Feed it every Quagga result; it returns the code
 * once the read is confirmed, and null until then.
 */
export const createReadConfirmer = () => {
  let last = "";
  let streak = 0;
  return (result: QuaggaJSResultObject): string | null => {
    const code = result.codeResult.code;
    // A poor frame is ignored rather than counted against the streak: a clean
    // read that stutters through one smeared frame is still a clean read.
    if (!code || medianError(result) > MAX_MEDIAN_ERROR) return null;
    if (code === last) streak += 1;
    else {
      last = code;
      streak = 1;
    }
    if (streak < CONFIRM_READS) return null;
    last = "";
    streak = 0;
    return code;
  };
};

/** How long the same code is ignored after it has been accepted. */
export const REPEAT_COOLDOWN_MS = 2000;

/**
 * The guard against one barcode being collected over and over.
 *
 * `createReadConfirmer` clears its streak after a confirmed read, so a code
 * left sitting in the guide re-confirms three frames later and keeps firing.
 * Item Lookup never saw it: its camera stops on the read. A page that scans
 * continuously — Scan Collect, the Performance search — needs the code itself
 * to go quiet for a moment, which is also how long it takes to move the phone
 * to the next tag.
 *
 * Keyed by code rather than by "the last one", so working two tags
 * alternately doesn't slip a repeat through on every other read.
 */
export const createRepeatGuard = (
  cooldownMs: number = REPEAT_COOLDOWN_MS,
  now: () => number = () => Date.now(),
) => {
  const accepted = new Map<string, number>();
  return (code: string): boolean => {
    const t = now();
    // Prune as we go: a session scanning hundreds of codes would otherwise
    // hold every one of them for the life of the camera.
    for (const [seen, at] of accepted) if (t - at >= cooldownMs) accepted.delete(seen);
    if (accepted.has(code)) return false;
    accepted.set(code, t);
    return true;
  };
};
