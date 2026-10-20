/**
 * What counts as a code someone may type in.
 *
 * Deliberately looser than a scan. `isWedgeScan` wants 8 to 14 digits, but
 * that is how a wedge is told apart from a person typing — nobody puts twelve
 * characters into a single input event — and it was never a rule about what a
 * code may be. Produce is keyed by PLU: four or five digits, no check digit,
 * and 4011 is bananas in every store in the country. The scan rule applied to
 * the keyboard meant produce could not be tagged at all.
 *
 * Digits only, and capped at 14 — past that it is not a code, it is a typo.
 *
 * One definition, imported by both the capture row and the correct-a-row
 * panel, because they had already drifted apart once.
 */
export const isEnterableUpc = (value: string): boolean => /^\d{4,14}$/.test(value.trim());
