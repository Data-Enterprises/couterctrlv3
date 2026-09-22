import { useStore } from "react-redux";
import { useAppDispatch } from ".";
import type { RootState } from "../store";
import { emptyGroup } from "../features/groupSlice";
import { setLastGroup, setSelectedGroup } from "../features/searchSlice";
import { setUserPrefs } from "../api/user";

/**
 * After a group is deleted, stop searching with it.
 *
 * If the deleted group is the one the search is set to, the selection is
 * cleared, so no page sends a group id that no longer exists (it would come
 * back empty and read as "no data") and the search card asks for a new group.
 *
 * With `persistPrefs`, the user's saved search is pointed back at their last
 * store, so the next sign-in doesn't restore the deleted group. The prefs
 * endpoint can't null `last_group` (it only writes one it's given), but a
 * "Store" search type means it isn't read. Shared groups don't need this: the
 * backend clears `last_group` for everyone when one is deleted.
 */
export const useForgetDeletedGroup = () => {
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();

  return (deletedId: number, { persistPrefs = false } = {}) => {
    const state = store.getState();
    const { lastGroup, selectedGroup, lastStore } = state.search;
    if (lastGroup !== deletedId && selectedGroup?.id !== deletedId) return;

    dispatch(setLastGroup(0));
    dispatch(setSelectedGroup(emptyGroup));

    if (persistPrefs && state.user.userid) {
      setUserPrefs(state.app.url, state.app.token, {
        userid: state.user.userid,
        last_search: lastStore ?? 0,
        last_search_type: "Store",
      }).catch(() => {
        // Only the next sign-in is affected; this session is already cleared.
      });
    }
  };
};
