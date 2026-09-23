/**
 * Product codes as people actually supply them.
 *
 * Pasted from a spreadsheet column, a chat message or a scanner log, so the
 * separators are whatever that source used — newlines, commas, tabs, spaces,
 * semicolons. Same split UPC List uses on its own paste box; this one also
 * drops duplicates, because a pasted column routinely repeats a code and the
 * endpoint gains nothing from being told twice.
 *
 * Non-numeric tokens are dropped rather than sent: product_code is digits, and
 * a stray header row ("UPC") would otherwise become a filter that matches
 * nothing and quietly empty the file.
 */
export const parseProductCodes = (text: string): string[] => {
  const seen = new Set<string>();
  for (const token of text.split(/[\n,;\r\t ]+/)) {
    const code = token.trim();
    if (code && /^\d+$/.test(code)) seen.add(code);
  }
  return [...seen];
};

/**
 * What a code looks like once storage has had it.
 *
 * `product_code` arrives from the table with a trailing ".0" often enough that
 * the top-ten query strips it inline (`replace(r.product_code, '.0', '')`), so
 * the sample filter compares on the stripped form. Typing 1200000088 has to
 * match a row holding 1200000088.0.
 */
export const normalizeProductCode = (value: unknown) =>
  String(value ?? "").trim().replace(/\.0$/, "");
