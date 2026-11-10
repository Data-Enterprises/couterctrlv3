// Hooks
import { useAppSelector } from "../../../../../../hooks";

// Redux
import { shallowEqual } from "react-redux";

// Utils
import { pageStoreOf } from "../utils";

/**
 * What a new ticket's search is built from: the shared search, the user's stores, and
 * the store the page picked itself (`href` is the page it was filed from, or null).
 */
export const useTicketScope = (href: string | null) => {
  const shared = useAppSelector((state) => state.search);
  const assignedStores = useAppSelector((state) => state.user.assignedStores);
  const own = useAppSelector(
    (state) => (href !== null ? pageStoreOf(state, href) : undefined),
    shallowEqual,
  );
  return { shared, assignedStores, own };
};
