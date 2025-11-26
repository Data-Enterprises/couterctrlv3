import { useAppSelector } from "../../../hooks";

export const useUpcContext = () => {
  const { url, token } = useAppSelector((state) => state.app);
  const { userid } = useAppSelector((state) => state.user);
  const { startDate, endDate } = useAppSelector((state) => state.search);

  return { url, token, userid, startDate, endDate };
};
