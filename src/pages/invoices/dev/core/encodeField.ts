import { Decimal } from "./Decimal";
import type { FieldSpec, FieldValue } from "./types";

/**
 * Writing a value back into its fixed-width column.
 *
 * The mirror of `decodeField`, and it exists for one reason: a file that was
 * corrected on screen and then uploaded untouched was never corrected at all.
 *
 * **Padding is inferred from the column it is replacing, not assumed.** These
 * layouts pad differently field by field — a UPC is zero-filled on the left,
 * a description space-filled on the right — and the schema does not say
 * which. Guessing would corrupt a column that reads fine today, and a
 * fixed-width file gives no sign it has been corrupted: every later column
 * still lines up, it just means something else. So the original span is read
 * first and matched.
 *
 * Only edited fields are ever re-encoded. Everything else in the line is
 * copied through byte for byte.
 */

const POSITIVE_OVERPUNCH = "{ABCDEFGHI";
const NEGATIVE_OVERPUNCH = "}JKLMNOPQR";

/**
 * A `Decimal` into digits with its sign in the last character.
 *
 * `decimals` comes from the field, not from the value: a Decimal carrying two
 * places written into a four-place column has to grow two zeros, or the
 * figure silently divides by a hundred.
 */
export const encodeOverpunch = (
  value: Decimal,
  width: number,
  decimals: number,
): string => {
  const scaled = value.divideBy(1n, decimals);
  const negative = scaled.units < 0n;
  const digits = (negative ? -scaled.units : scaled.units).toString();
  const padded = digits.padStart(width, "0");

  // Longer than the column means the correction cannot be written at all --
  // truncating would store a different number, which is worse than refusing.
  if (padded.length > width) {
    throw new Error(
      `${value.toString()} does not fit ${width} characters`,
    );
  }

  const last = Number(padded[padded.length - 1]);
  const sign = negative ? NEGATIVE_OVERPUNCH : POSITIVE_OVERPUNCH;
  return padded.slice(0, -1) + sign[last];
};

/** How the column being replaced was padded, so the replacement matches. */
const padLike = (original: string, next: string, width: number): string => {
  if (next.length >= width) return next.slice(0, width);
  const zeroFilled = /^0\d*$/.test(original.trim()) && original === original.trimStart();
  return zeroFilled
    ? next.padStart(width, "0")
    : next.padEnd(width, " ");
};

/**
 * One field, encoded for its column. `original` is the span it replaces.
 *
 * Returns null when the value is one this cannot write — an unreadable date,
 * or a number too wide for its column. The caller leaves the original span
 * alone and says so, rather than writing something it made up.
 */
export const encodeField = (
  value: FieldValue,
  field: FieldSpec,
  original: string,
): string | null => {
  const width = field.end - field.start + 1;

  switch (field.type) {
    case "signed": {
      if (!(value instanceof Decimal)) return null;
      try {
        return encodeOverpunch(value, width, field.decimals ?? 0);
      } catch {
        return null;
      }
    }

    case "date": {
      // Decoded dates are `yyyy-mm-dd`; the column holds `yyyymmdd`. Null is
      // a legitimate value here -- a blank date column -- and writes zeros,
      // which is what the file uses for "none".
      if (value === null) return "0".repeat(width);
      if (typeof value !== "string") return null;
      const digits = value.replace(/-/g, "");
      return /^\d{8}$/.test(digits) && digits.length <= width
        ? digits.padStart(width, "0")
        : null;
    }

    case "int": {
      if (typeof value !== "number" || !Number.isFinite(value)) return null;
      return padLike(original, String(Math.trunc(value)), width);
    }

    case "id":
    case "text": {
      if (typeof value !== "string") return null;
      // Too long to fit is a refusal, not a trim: a truncated UPC is a
      // different item and a truncated description is a lie.
      if (value.length > width) return null;
      return field.type === "text"
        ? value.padEnd(width, " ")
        : padLike(original, value, width);
    }
  }
};

/** The span this field occupies, for comparing against or replacing. */
export const fieldSpan = (line: string, field: FieldSpec): string =>
  line.slice(field.start - 1, field.end);

/** `line` with `field` replaced. The rest of the line is untouched. */
export const writeField = (
  line: string,
  field: FieldSpec,
  encoded: string,
): string =>
  line.slice(0, field.start - 1) + encoded + line.slice(field.end);
