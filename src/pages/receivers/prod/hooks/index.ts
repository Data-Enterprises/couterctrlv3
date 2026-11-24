// Hooks
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";

// Redux
import * as receiversActions from "../../../../features/receiversSlice";

// API
import { getReceiversList } from "../../../../api/receivers";

// Utils
import {
  scopeToStoreNumber,
  storeNumbersIn,
} from "../../../../utils/storeIdentity";
import { reasonOf } from "../../../../utils/serverError";

// Interfaces
import type { ReceiverListResponse } from "../../../../interfaces";

export const useReceiversState = () =>
  useAppSelector((state) => state.prod.receivers);

/** The API connection, the search and the user's stores, for Receivers' parts. */
export const useReceiversCtx = () => {
  const { url, token, isMobile } = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);
  const { assignedStores } = useAppSelector((state) => state.user);
  return { url, token, isMobile, search, assignedStores };
};

/**
 * Receivers' action creators.
 *
 * Used to hand back the legacy slice's actions whenever `devMode` was off,
 * back when that meant the legacy Receivers page was on screen. Receivers has
 * no legacy page any more, and the legacy slice is gone with it.
 */
export const useReceiversActions = () => receiversActions;

/**
 * The search: the chosen store's receivers over the picked dates. A storeid
 * shared by co-located stores returns both locations, so the first is shown
 * and the others are offered.
 */
export const useReceiversSearch = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const state = useReceiversState();
  const { url, token, search } = useReceiversCtx();
  const {
    reQuery,
    setIsFetchingList,
    setListGridData,
    setNoReceivers,
    setReceiversList,
    setAvailableStoreNumbers,
    setSelectedStoreNumber,
  } = receiversActions;

  const getReceivers = () => {
    if (!state.storeid) {
      toast.warn("Please select a store");
      return;
    }
    dispatch(reQuery());
    dispatch(setIsFetchingList(true));
    // Cleared on every search: leaving it set means a later failure shows
    // this notice describing the *previous* search alongside the error toast.
    dispatch(setNoReceivers(false));
    getReceiversList(
      url,
      token,
      state.storeid,
      search.startDate,
      search.endDate,
    )
      .then((resp) => {
        const j: ReceiverListResponse = resp.data;
        if (j.error !== 0) {
          toast.warn(j.msg ?? "Failed to load receivers");
        } else if (j.recievers.length > 0) {
          // Fetched by storeid, so a co-located storeid returns both locations
          // mixed together. Discover them and default to the first, matching
          // how Sub Dept Margins presents the same situation.
          const numbers = storeNumbersIn(j.recievers);
          dispatch(setAvailableStoreNumbers(numbers));
          const scope = numbers.length > 1 ? numbers[0] : null;
          dispatch(setSelectedStoreNumber(scope));
          const rows = scope
            ? scopeToStoreNumber(j.recievers, scope)
            : j.recievers;
          dispatch(setReceiversList(j.recievers));
          dispatch(setListGridData(rows));
        } else {
          toast.warn("No receivers came back for this search.");
          dispatch(setNoReceivers(true));
        }
      })
      .catch((err) => toast.error(reasonOf(err)))
      .finally(() => dispatch(setIsFetchingList(false)));
  };

  return getReceivers;
};
