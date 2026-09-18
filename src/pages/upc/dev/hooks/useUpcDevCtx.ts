import { useAppSelector } from "../../../../hooks";
import { upcFixesOn } from "../upcFixes";

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
    /** The endpoint corrections, dev-API only — see upcFixes.ts. */
    fixes: upcFixesOn(apiEnv),
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
