/** Which of the searched UPCs a module hasn't fetched yet. Empty means the
 *  module is complete for this search and must not call at all. */
export const missingFrom = (upcs: string[], coverage: string[]): string[] => {
  const have = new Set(coverage);
  return upcs.filter((u) => !have.has(u));
};
