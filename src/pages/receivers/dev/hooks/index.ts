// Hooks
import { useAppSelector } from "../../../../hooks";

// Redux
import * as receiversActions from "../../../../features/dev/devReceiversSlice";

export const useReceiversState = () =>
  useAppSelector((state) => state.dev.receivers);

/** The API connection, the search and the user's stores, for Receivers' parts. */
export const useReceiversCtx = () => {
  const { url, token } = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);
  const { assignedStores } = useAppSelector((state) => state.user);
  return { url, token, search, assignedStores };
};

/**
 * Receivers' action creators.
 *
 * Used to hand back the legacy slice's actions whenever `devMode` was off,
 * back when that meant the legacy Receivers page was on screen. Receivers has
 * no legacy page any more, and the legacy slice is gone with it.
 */
export const useReceiversActions = () => receiversActions;
