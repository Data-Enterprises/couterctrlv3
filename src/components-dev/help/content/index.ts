import type { HelpPage } from "../../../constants/helpPages";
import type { HelpContent } from "../helpTypes";
import { ADMIN_HELP } from "./admin";

/**
 * Which screens have been converted to the panel.
 *
 * The S3 help pages are being retired, not switched off: a page is in this map
 * once its content has been written and its anchors exist, and until then its
 * "?" opens the old document. That keeps every page's help working through a
 * conversion that spans weeks, and it makes "are we done" a question with an
 * answer — the last entry added is the day `InfoModal`, `useHelpPageUrl`, the
 * bucket and `htmlPages/build.py` can all go.
 */
export const HELP_CONTENT: Partial<Record<HelpPage, HelpContent>> = {
  admin: ADMIN_HELP,
};

export const helpContentFor = (page: HelpPage): HelpContent | undefined =>
  HELP_CONTENT[page];
