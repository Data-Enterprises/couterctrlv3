/**
 * The gate on unreleased pages.
 *
 * Item Actions, Price Opt Sub Dept and Price Opt Vendor are built and routed
 * but not released. They are held behind an ownership level rather than a build
 * flag so the people deciding whether a page ships can use it in production
 * against real data.
 *
 * The level lives here, alone, because it is enforced in three unrelated
 * shapes: the nav's `canSee` wants exact-match strings, the entry points on the
 * performance pages want a numeric comparison, and both have to agree. A page
 * whose nav entry is hidden while its "See item actions" button is still on
 * screen is worse than no gate at all — it advertises the page and then 404s
 * the expectation.
 *
 * Releasing a page means removing it from the Coming Soon category and dropping
 * the check at its entry points; nothing here needs to change.
 */

/** Owner. Levels run 1 basic, 2 user, 5 manager, 7 owner, 9 programmer. */
export const COMING_SOON_MIN_LEVEL = 7;

/**
 * The same gate as exact-match strings, for `navigation.userLevels`.
 *
 * The nav's `canSee` tests `userLevels.includes(level.toString())` rather than
 * a floor, so "owner and up" has to be enumerated. 8 is undocumented in the
 * level legend but is already carried by the Admin and User Management gates,
 * so it is honoured here too rather than silently locking out whoever holds it.
 */
export const COMING_SOON_LEVELS = ["7", "8", "9"];
