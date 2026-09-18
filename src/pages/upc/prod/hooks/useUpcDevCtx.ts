import { useAppSelector } from "../../../../hooks";

export const useUpcDevCtx = () => {
  const { url, token, apiEnv } = useAppSelector((s) => s.app);
  const { userid, assignedStores } = useAppSelector((s) => s.user);
  const { startDate, endDate, selectedStore, selectedGroup, type: searchType } = useAppSelector((s) => s.search);
  const groups = useAppSelector((s) => s.group.groups);
  const dev = useAppSelector((s) => s.prod.upcDev);

  return {
    url,
    token,
    apiEnv,
    /** The endpoint corrections (Trend direction/window/impact, Price Opt by
     *  weight, failed calls not recorded as empty). Off in the prod tree — this
     *  is the page prod users have always had. On in the dev tree; promoting dev
     *  turns them on here. Replaces upcFixes.ts, which keyed this off apiEnv
     *  while both environments shared one tree. */
    fixes: false,
    userid,
    assignedStores,
    startDate,
    endDate,
    selectedStore,
    selectedGroup,
    searchType,
    groups,
    ...dev,
  };
};
