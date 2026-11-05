// Hooks
import { useAppDispatch, useAppSelector } from "../../../../../hooks";
import { useForgetDeletedGroup } from "../../../../../hooks/useForgetDeletedGroup";

// API
import { getGroups } from "../../../../../api/groups";

// Redux
import { setGroups, type Group } from "../../../../../features/groupSlice";

export const useSharedGroupsCtx = () => {
  const { url, token } = useAppSelector((s) => s.app);
  const { userid, userLevel } = useAppSelector((s) => s.user);
  return { url, token, userid, userLevel };
};

export const useRefreshMyGroups = () => {
  const dispatch = useAppDispatch();
  const forgetDeletedGroup = useForgetDeletedGroup();
  const { url, token } = useAppSelector((s) => s.app);

  return (deletedId?: number) => {
    if (deletedId) forgetDeletedGroup(deletedId);
    getGroups(url, token)
      .then((resp) => {
        const j = resp.data;
        if (j.error == "0") dispatch(setGroups(j.groups as Group[]));
      })
      .catch(() => {});
  };
};
