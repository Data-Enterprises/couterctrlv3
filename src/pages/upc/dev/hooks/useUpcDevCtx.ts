import { useAppSelector } from "../../../../hooks";

export const useUpcDevCtx = () => {
  const { url, token } = useAppSelector((s) => s.app);
  const { userid, assignedStores } = useAppSelector((s) => s.user);
  const { startDate, endDate, selectedStore, selectedGroup, type: searchType } = useAppSelector((s) => s.search);
  const groups = useAppSelector((s) => s.group.groups);
  const dev = useAppSelector((s) => s.upcDev);

  return {
    url,
    token,
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
