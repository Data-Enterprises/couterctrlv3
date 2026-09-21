/** Which of the searched UPCs a module hasn't fetched yet.
 *
 *  The one question every module's fetch effect asks. An empty result means
 *  the module is complete for the current search and must not call at all —
 *  that's what makes adding a UPC to an existing search cost one small call
 *  per opened module rather than a full re-fetch of everything.
 */
export const missingFrom = (upcs: string[], coverage: string[]): string[] => {
  const have = new Set(coverage);
  return upcs.filter((u) => !have.has(u));
};
