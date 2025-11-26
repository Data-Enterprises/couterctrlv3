import { useAppSelector } from "../../../hooks";

export const useUpcContext = () => {
  const { url, token } = useAppSelector((state) => state.app);
  const { userid } = useAppSelector((state) => state.user);
  const { startDate, endDate } = useAppSelector((state) => state.search);
  const { index, selectedMode, storeids, dataLoaded } = useAppSelector((state) => state.upc);

  return { url, token, userid, startDate, endDate, index, selectedMode, storeids, dataLoaded };
};
