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
/**
 * Description terms, one per line or separated by commas.
 *
 * Not split on spaces, unlike the codes: "WHOLE MILK" is one thing to look
 * for, and splitting it would quietly widen the filter to every line holding
 * either word. Case is left alone here and ignored at both ends of the match.
 */
export const parseDescriptionTerms = (text: string) => {
  const seen = new Set<string>();
  return text
    .split(/[\n,;\r]+/)
    .map((term) => term.trim())
    .filter((term) => {
      if (term === "" || seen.has(term.toLowerCase())) return false;
      seen.add(term.toLowerCase());
      return true;
    });
};

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
