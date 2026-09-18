import { Decimal, DecimalError } from "./Decimal";

/**
 * Signed-overpunch decoding — the convention these mainframe-era files use to
 * fit a sign into a fixed-width numeric field without spending a character on
 * it.
 *
 * The sign is folded into the **last digit**: `0000244{` is +2440 and
 * `0000244}` is −2440. `{` through `I` carry a positive 0–9, `}` through `R` a
 * negative 0–9. So the field is all digits except its final character, which is
 * both a digit and the sign.
 *
 * The decimal point is implied, never written. A `decimals: 2` field holding
 * `0000244{` is $24.40, and reading it as 2440 — or as 244 — is a silent
 * hundred-fold error, which is exactly the kind reconciliation exists to catch.
 *
 * Verified against the AWG sample: every digit-run terminator in that file is
 * one of these twenty characters and nothing else.
 */
const POSITIVE: Record<string, string> = {
  "{": "0",
  A: "1",
  B: "2",
  C: "3",
  D: "4",
  E: "5",
  F: "6",
  G: "7",
  H: "8",
  I: "9",
};

const NEGATIVE: Record<string, string> = {
  "}": "0",
  J: "1",
  K: "2",
  L: "3",
  M: "4",
  N: "5",
  O: "6",
  P: "7",
  Q: "8",
  R: "9",
};

/**
 * Decodes one overpunched field.
 *
 * Throws on a trailing character it doesn't recognise rather than guessing.
 * A wrong amount that looks plausible is the worst outcome here: it passes
 * through the UI, through reconciliation if it happens to land, and into the
 * pipeline. Refusing loudly keeps the failure where someone can see it.
 *
 * An all-blank field is a legitimately absent value and decodes to zero — these
 * layouts pad unused fields with spaces rather than zeros.
 */
export const decodeOverpunch = (raw: string, decimals = 0): Decimal => {
  const trimmed = raw.trim();
  if (trimmed === "") return Decimal.zero(decimals);

  const last = trimmed[trimmed.length - 1];
  const head = trimmed.slice(0, -1);

  let digits: string;
  let negative = false;

  if (last in POSITIVE) {
    digits = head + POSITIVE[last];
  } else if (last in NEGATIVE) {
    digits = head + NEGATIVE[last];
    negative = true;
  } else if (last >= "0" && last <= "9") {
    // Some fields carry an unsigned value in the same shape. Treated as
    // positive, which is what the layout means when it omits a sign.
    digits = trimmed;
  } else {
    throw new DecimalError(
      `invalid trailing character '${last}' in overpunched field '${raw}'`,
    );
  }

  if (!/^[0-9]+$/.test(digits)) {
    throw new DecimalError(`non-numeric body in overpunched field '${raw}'`);
  }

  const units = BigInt(digits);
  return new Decimal(negative ? -units : units, decimals);
};
