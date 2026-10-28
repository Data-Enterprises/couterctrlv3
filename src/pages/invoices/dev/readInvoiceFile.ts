/**
 * Reading a dropped or chosen invoice file, in one place.
 *
 * The encoding is the whole reason this is not inlined at each call site.
 * These are **fixed-width** records and must be read as **ISO-8859-1**:
 * reading them as UTF-8 shifts every column after the first non-ASCII byte,
 * and a shifted column decodes as bad data rather than as an encoding error —
 * so it would be blamed on the vendor rather than on us.
 *
 * Two places take a file now — the entry card before anything is loaded, and
 * the page itself once something is. One reader keeps that detail from
 * drifting between them.
 */
export const readInvoiceFile = (
  file: File,
  onFile: (text: string, fileName: string) => void,
): void => {
  const reader = new FileReader();
  reader.onload = (event) =>
    onFile(String(event.target?.result ?? ""), file.name);
  reader.readAsText(file, "ISO-8859-1");
};
