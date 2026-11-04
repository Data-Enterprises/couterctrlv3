import { useCallback } from "react";
import { useAppDispatch } from "../../../hooks";
import { setRefresh } from "../../../features/dev/devUsersSlice";

/**
 * Mark the Users tab's list as out of date.
 *
 * The Companies, Base Groups and Stores tabs each read their own copy of the
 * users, so a write there never reached the list the Users tab edits from.
 * Edit then started from a stale row, and its company save (which replaces
 * the whole list) could undo a company just added on the Companies tab. Every
 * write on those tabs calls this; the page re-reads the list straight away.
 */
export const useMarkUsersStale = () => {
  const dispatch = useAppDispatch();
  return useCallback(() => {
    dispatch(setRefresh(true));
  }, [dispatch]);
};
