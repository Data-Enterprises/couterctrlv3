/**
 * A sub department's identity on one store: its number AND its description.
 *
 * The number alone is not unique. ACE stores file eight different lines under
 * department 0 (coupons, rewards, rounding, donations), so grouping on the
 * number merges them into one row with whichever name came first.
 */

/** The two fields every sub-department row carries. A missing number is 0,
 *  as the backend files it. */
export interface SubDeptIdentity {
  sub_department: number | null;
  sub_department_description: string | null;
}

/** `"0|DONATION"`: the number and the description exactly as sent. */
export const subDeptKey = (r: SubDeptIdentity) =>
  `${r.sub_department ?? 0}|${r.sub_department_description ?? ""}`;

/** The number back out of a key, for the endpoints that filter by number. */
export const subDeptNumber = (key: string) =>
  Number(key.slice(0, key.indexOf("|")));
