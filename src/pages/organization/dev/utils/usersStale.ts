// Hooks
import { useCallback } from "react";
import { useAppDispatch } from "../../../../hooks";

// Redux
import { setRefresh } from "../../../../features/dev/devUsersSlice";

/**
 * Mark the Users tab's list as out of date. The other tabs keep their own copy
 * of the users, so every write there calls this and the page re-reads; otherwise
 * Edit's company save (which replaces the whole list) could undo their change.
 */
export const useMarkUsersStale = () => {
  const dispatch = useAppDispatch();
  return useCallback(() => {
    dispatch(setRefresh(true));
  }, [dispatch]);
};
