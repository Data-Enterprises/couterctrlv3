import { useEffect } from "react";
import { useAppDispatch } from "../../../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { useGroupCtx } from "..";
import type { JsonError } from "../../../../interfaces";
import { getGroups } from "../../../../api/groups";
import {
  setGroups,
  setSelectedGroup,
  emptyGroup,
  type Group,
} from "../../../../features/groupSlice";
import {
  setCreateInput,
  setRefreshGroups,
  setSelectedForm,
  setStoresWithGroupStatus,
} from "../../../../features/dev/devGroupsPageSlice";

/**
 * The data side of the Groups screens, shared by the desktop panel and the
 * phone view: loads the user's groups and keeps the mobile form state in step.
 *
 * Everything GET /groups/ returns: their own groups, the shared groups they
 * created, and the shared groups other people shared with them. Shared ones
 * carry the SHARED badge and open read-only, showing only the stores the
 * user is assigned to; they're managed on User Management's Shared Groups tab.
 *
 * Reloaded on open rather than trusting the list fetched at sign-in, which is
 * stale the moment a group is shared or unshared.
 */
export const useGroupsData = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const ctx = useGroupCtx();

  // These two effects only matter for the mobile view — GroupsMobile still
  // switches its own internal view off the shared selectedForm/createInput/
  // storesWithGroupStatus slice fields, so this reset-on-tab-change behavior
  // has to stay intact for them even though the desktop panel never reads
  // those fields itself.
  useEffect(() => {
    dispatch(setRefreshGroups(true));
  }, []);

  useEffect(() => {
    dispatch(setSelectedForm("create"));
    return () => {
      dispatch(setSelectedGroup(emptyGroup));
      dispatch(setCreateInput(""));
      dispatch(setStoresWithGroupStatus([]));
      dispatch(setSelectedForm(""));
    };
  }, []);

  useEffect(() => {
    dispatch(setSelectedGroup(emptyGroup));
    dispatch(setCreateInput(""));
    dispatch(setStoresWithGroupStatus([]));
  }, [ctx.selectedForm]);

  useEffect(() => {
    if (!ctx.refreshGroups) return;
    getGroups(ctx.url, ctx.token)
      .then((resp) => {
        const j = resp.data;
        if (j.error == "0") {
          dispatch(setGroups(j.groups as Group[]));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(setRefreshGroups(false)));
  }, [ctx.token, ctx.refreshGroups]);
};