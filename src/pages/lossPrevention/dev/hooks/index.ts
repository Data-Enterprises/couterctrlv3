// Hooks
import { shallowEqual } from "react-redux";
import { useAppSelector } from "../../../../hooks";

// Utils
import { lpParams } from "../utils";

/** The Loss Prevention slice, the API connection, the searched week and scope and the user's stores, read where they are used instead of passed down. */
export const useLossPreventionCtx = () => {
  const lossPrevention = useAppSelector((s) => s.dev.lossPrevention, shallowEqual);
  const { apiEnv, url, token } = useAppSelector((s) => s.app);
  const search = useAppSelector((s) => s.search);
  const assignedStores = useAppSelector((s) => s.user.assignedStores);
  // What was searched, else the picker before a search.
  const scope = lossPrevention.searchedScope ?? search;
  return {
    ...lossPrevention,
    apiEnv,
    url,
    token,
    search,
    assignedStores,
    weekDate: scope.singleDate,
    params: { url, token, ...lpParams(scope) },
  };
};
