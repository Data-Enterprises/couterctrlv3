import { useAppSelector } from "../hooks";
import { formatGoliathDate } from "../utils";

export const useApiContext = () => {
  const { url, token } = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);

  const useGroups = search.type === "Group" ? 1 : 0;
  const singleStore = search.type === "Store" ? 1 : 0;
  const searchValue =
    search.type === "Group" ? search.lastGroup : search.lastStore;

  const start = formatGoliathDate(search.startDate);
  const end = formatGoliathDate(search.endDate);

  return {
    url,
    token,
    useGroups,
    singleStore,
    searchValue,
    start,
    end,
  };
};
