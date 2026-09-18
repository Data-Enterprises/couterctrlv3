/**
 * Whether the UPC List endpoint corrections are switched on.
 *
 * Every fix on this branch — Trend's direction, window and impact corrections,
 * Price Opt's by-weight figures, and the three tabs no longer recording a
 * failed call as a fetched-and-empty one — is behind this one flag, because
 * the build that carries them is a single bundle that both environments load.
 * Until the dev and prod UIs are separated, `apiEnv` is the only line between
 * them: the Prod/Dev switch lives in the avatar dropdown at userLevel 7+, so a
 * client on the prod API sees exactly the page they saw yesterday.
 *
 * This is the whole seam. Every call site names `fixes`, so making these the
 * only behaviour later is a find on that word — there is no second place to
 * hunt for.
 */
export const upcFixesOn = (apiEnv: "dev" | "prod") => apiEnv === "dev";
