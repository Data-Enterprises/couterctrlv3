/**
 * Exact fixed-point money, backed by `bigint`.
 *
 * Invoice work is reconciliation work: derived line sums are compared to the
 * vendor's printed total **to the cent**, and that check is the only reason to
 * trust anything the parser says. Floating point cannot support it — 0.1 + 0.2
 * is famously not 0.3, and a four-hundred-line invoice accumulates that error
 * until a correct parse reports a mismatch.
 *
 * So amounts are an integer count of the smallest unit plus a scale. $12.34 is
 * `units 1234n, decimals 2`. Nothing here ever produces a `number`, and there
 * is deliberately no `toNumber()`: the moment a caller could reach for one, the
 * cent-exact guarantee stops being enforceable.
 */
export class DecimalError extends Error {}

export class Decimal {
  readonly units: bigint;
  readonly decimals: number;

  constructor(units: bigint, decimals: number) {
    if (!Number.isInteger(decimals) || decimals < 0) {
      throw new DecimalError(
        `decimals must be a non-negative integer, got ${decimals}`,
      );
    }
    this.units = units;
    this.decimals = decimals;
  }

  static zero(decimals = 2): Decimal {
    return new Decimal(0n, decimals);
  }

  /**
   * Reads a human-typed amount — "12.34", "-5", "1,234.50".
   *
   * Used for edits, where someone corrects a misread figure. Rejects anything
   * it doesn't fully understand rather than salvaging part of it: a silently
   * half-parsed correction is worse than a rejected one.
   */
  static parse(input: string, decimals = 2): Decimal {
    const cleaned = input.trim().replace(/,/g, "");
    const match = /^([+-]?)(\d*)(?:\.(\d*))?$/.exec(cleaned);
    if (!match || (match[2] === "" && (match[3] ?? "") === "")) {
      throw new DecimalError(`not a number: '${input}'`);
    }
    const [, sign, whole, frac = ""] = match;
    // Pad or truncate the fraction to the target scale. Truncation rather than
    // rounding: this parses a figure someone read off a document, and inventing
    // a rounded value would put a number on screen that is on no invoice.
    const scaled = (frac + "0".repeat(decimals)).slice(0, decimals);
    const units = BigInt((whole || "0") + scaled);
    return new Decimal(sign === "-" ? -units : units, decimals);
  }

  /** Both operands rescaled to the finer of the two, so adding a whole-unit
   *  count to a cent amount can't quietly drop the cents. */
  private static align(a: Decimal, b: Decimal): [bigint, bigint, number] {
    const decimals = Math.max(a.decimals, b.decimals);
    const lift = (d: Decimal) => d.units * 10n ** BigInt(decimals - d.decimals);
    return [lift(a), lift(b), decimals];
  }

  add(other: Decimal): Decimal {
    const [x, y, decimals] = Decimal.align(this, other);
    return new Decimal(x + y, decimals);
  }

  subtract(other: Decimal): Decimal {
    const [x, y, decimals] = Decimal.align(this, other);
    return new Decimal(x - y, decimals);
  }

  negate(): Decimal {
    return new Decimal(-this.units, this.decimals);
  }

  /** Multiplies by a whole number — a quantity, never another money amount.
   *  Money times money is meaningless, and allowing it would invite it. */
  multiplyByInteger(count: bigint): Decimal {
    return new Decimal(this.units * count, this.decimals);
  }

  /**
   * Divides by a whole number, to a stated number of places.
   *
   * The scale is a parameter rather than inherited because a quotient needs
   * more places than its operands: $18.41 across ten units is $1.841, and
   * forcing that back to cents would throw away a figure the invoice supports.
   *
   * All integer arithmetic. The dividend is lifted to the target scale *before*
   * dividing, so the only rounding is the single half-up step at the end —
   * which is the last possible moment, and is what keeps "nothing rounds until
   * it is printed" true of a derived figure as well as a decoded one.
   */
  divideBy(divisor: bigint, scale: number): Decimal {
    if (divisor === 0n) {
      throw new DecimalError("cannot divide by zero");
    }
    const lift = BigInt(Math.max(0, scale - this.decimals));
    const drop = BigInt(Math.max(0, this.decimals - scale));
    const numerator = this.units * 10n ** lift;
    const denominator = divisor * 10n ** drop;

    const negative = numerator < 0n !== denominator < 0n;
    const a = numerator < 0n ? -numerator : numerator;
    const b = denominator < 0n ? -denominator : denominator;
    const quotient = a / b;
    // Half-up on the magnitude, so -0.5 and 0.5 round away from zero alike
    // rather than one of them drifting toward it.
    const rounded = (a % b) * 2n >= b ? quotient + 1n : quotient;
    return new Decimal(negative ? -rounded : rounded, scale);
  }

  equals(other: Decimal): boolean {
    const [x, y] = Decimal.align(this, other);
    return x === y;
  }

  compare(other: Decimal): -1 | 0 | 1 {
    const [x, y] = Decimal.align(this, other);
    return x < y ? -1 : x > y ? 1 : 0;
  }

  isZero(): boolean {
    return this.units === 0n;
  }

  isNegative(): boolean {
    return this.units < 0n;
  }

  /** Absolute difference, for reporting how far a reconciliation missed by. */
  absoluteDifference(other: Decimal): Decimal {
    const diff = this.subtract(other);
    return diff.isNegative() ? diff.negate() : diff;
  }

  /**
   * The canonical string: sign, whole part, then exactly `decimals` places.
   *
   * Built from the digits rather than via `Number`, so a value beyond 2^53
   * still prints exactly. Everything the UI displays comes through here.
   */
  toString(): string {
    const negative = this.units < 0n;
    const digits = (negative ? -this.units : this.units)
      .toString()
      .padStart(this.decimals + 1, "0");
    const cut = digits.length - this.decimals;
    const whole = digits.slice(0, cut);
    const frac = digits.slice(cut);
    return `${negative ? "-" : ""}${whole}${frac ? `.${frac}` : ""}`;
  }
}

/** Sums one `signed` field across records. The scale is stated by the caller
 *  rather than inferred, so an empty list still returns a comparable zero. */
export const sumDecimals = (values: Decimal[], decimals: number): Decimal =>
  values.reduce((total, value) => total.add(value), Decimal.zero(decimals));
