/** Weeks pulled on the first walk. Three of history plus the one being graded
 *  is the least that makes a baseline meaningful; more is a click away, and
 *  every extra week is another paged request. */
export const DEFAULT_WEEKS = 4;

/** Ceiling on "add week". Past this the walk gets slow enough to feel broken,
 *  and a quarter of history is well beyond what the rule needs. */
export const MAX_WEEKS = 12;
