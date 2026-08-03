/** Text helpers for the two legal panels. Kept out of LegalBits.tsx because a
 *  file that exports both components and plain functions breaks fast refresh.
 */

/** "prohibited_actions" → "Prohibited actions".
 *
 *  Both documents group lists under descriptive keys but supply no lead-in
 *  sentence, so a bare list reads as orphaned. Title-casing the key labels it
 *  without inventing legal wording — it names the list, it doesn't add an
 *  obligation. */
export const listLabel = (key: string) =>
  key.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

/** True for a run of prose written entirely in capitals — the convention both
 *  documents use for the clauses they most want read. Guards on length so an
 *  acronym in an ordinary sentence isn't mistaken for one. */
export const isShouted = (s: string) => {
  const letters = s.replace(/[^A-Za-z]/g, "");
  return letters.length > 24 && letters === letters.toUpperCase();
};
