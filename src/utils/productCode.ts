/**
 * One spelling of a product code, whatever the backend sent.
 *
 * The same UPC does not arrive the same way from every store. Verified against
 * `receivers/details` on two stores in the same tenancy:
 *
 *     store 111   "7800001280"        clean
 *     store 843   "7203096070.0"      stringified float
 *
 * Nothing in a UPC is fractional, so a trailing decimal is always an artifact of
 * the value having passed through a float somewhere upstream. It is invisible on
 * screen — both render as a number — but it is fatal to a join: an item received
 * at store 843 could never be matched to its sales rows, so Item Actions
 * reported "nothing received in 90 days" for a delivery that happened last week
 * and suggested calling the vendor about it.
 *
 * A code is a key, not a number. Normalise it the moment it enters, on **both**
 * sides of every join, so it stops mattering which endpoint is the dirty one.
 *
 * Null is a real value here too: `receivers/details` carries non-product lines
 * such as "Drop payment" with `product_code: null`, and `String(null)` would
 * quietly key them under "null". They resolve to the empty string instead, which
 * matches nothing and is easy to test for.
 */
export const normalizeProductCode = (
  code: string | number | null | undefined,
): string => {
  if (code === null || code === undefined) return "";
  // Trailing zeros only. `.5` is not a UPC that lost precision, it is data this
  // function has no business guessing about, so it is left alone to be noticed.
  return String(code).trim().replace(/\.0+$/, "");
};
