import { useAppSelector } from "../../../../hooks";

export const useUpcDevCtx = () => {
  const { url, token, apiEnv } = useAppSelector((s) => s.app);
  const { userid, assignedStores } = useAppSelector((s) => s.user);
  const { startDate, endDate, selectedStore, selectedGroup, type: searchType } = useAppSelector((s) => s.search);
  const groups = useAppSelector((s) => s.group.groups);
  const dev = useAppSelector((s) => s.dev.upcDev);

  return {
    url,
    token,
    apiEnv,
    /** The endpoint corrections (Trend direction/window/impact, Price Opt by
     *  weight, failed calls not recorded as empty). On in the dev tree, off in
     *  prod until this tree is promoted. Replaces upcFixes.ts, which keyed this
     *  off apiEnv while both environments shared one tree. */
    fixes: true,
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
