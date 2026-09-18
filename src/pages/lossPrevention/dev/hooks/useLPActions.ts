import * as lpActions from "../../../../features/lossPreventionSlice";

/**
 * Loss Prevention's action creators.
 *
 * Used to hand back the legacy slice's actions whenever `devMode` was off,
 * back when that meant the legacy LP page was on screen. LP has no legacy
 * page any more, and the legacy slice is gone with it.
 */
export const useLPActions = () => lpActions;
