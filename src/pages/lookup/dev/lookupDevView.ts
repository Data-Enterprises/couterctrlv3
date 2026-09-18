/**
 * Whether Item Lookup's mobile result screen shows the new report layout.
 *
 * Prod keeps `LookupResultScreen` exactly as it is; dev gets
 * `LookupItemReport`. One bundle serves both environments until the dev/prod
 * UI separation lands, so `apiEnv` is the only line between them — the same
 * seam `upcFixes.ts` uses, and it should be removed the same way when that
 * work replaces it.
 *
 * The two screens are separate files rather than one screen with branches, so
 * nothing in prod's render path is edited at all.
 */
export const lookupDevViewOn = (apiEnv: "dev" | "prod") => apiEnv === "dev";
