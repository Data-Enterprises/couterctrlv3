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

/**
 * The tighter half of the Coming Soon gate: level 9 only.
 *
 * Coming Soon is not one audience. Some pages are held back because they are
 * unfinished but usable — an owner running one against real data is the point
 * of the gate. Others are held back because they are not yet answerable to a
 * client at all: LP Actions, Invoices and both Price Opt pages either depend on
 * backend decisions that are still open or would invite questions nobody can
 * answer yet. Showing those to an owner is not early access, it is a support
 * call.
 *
 * So the category carries two levels rather than one. A page listed here is
 * invisible to 7 and 8; a page on `COMING_SOON_LEVELS` behaves as before. If
 * every page in the category ends up here, `visibleCategories` in TitleBar
 * drops the whole heading for 7 and 8 on its own — no extra handling needed.
 *
 * Deliberately not shared with `PROGRAMMER_LEVEL` in `pages/admin/dev/hooks`.
 * That one is authority over the tenancy — who may create and delete a
 * company. This one is release timing. They are the same number today and have
 * no reason to move together.
 *
 * No numeric twin here, unlike `COMING_SOON_MIN_LEVEL` above: none of these
 * four pages has an entry point anywhere else in the app, so nothing outside
 * the nav needs to ask the question. Item Actions is the page with entry
 * points, and it stays on the wider gate.
 */
export const PROGRAMMER_ONLY_LEVELS = ["9"];
