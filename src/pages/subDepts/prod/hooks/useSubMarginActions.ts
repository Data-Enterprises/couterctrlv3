import * as subMarginActions from "../../../../features/subMarginSlice";

/**
 * Sub Dept Margins' action creators.
 *
 * Used to hand back the legacy slice's actions whenever `devMode` was off,
 * back when that meant the legacy page was on screen. Sub Dept Margins has no
 * legacy page any more, and the legacy slice is gone with it.
 */
export const useSubMarginActions = () => subMarginActions;
