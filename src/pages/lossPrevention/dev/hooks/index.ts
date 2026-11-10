// Hooks
import { shallowEqual } from "react-redux";
import { useAppSelector } from "../../../../hooks";

/** The Loss Prevention slice, the API connection, the search and the user's stores, read where they are used instead of passed down. */
export const useLossPreventionCtx = () => {
  const lossPrevention = useAppSelector((s) => s.dev.lossPrevention, shallowEqual);
  const { apiEnv, url, token } = useAppSelector((s) => s.app);
  const search = useAppSelector((s) => s.search);
  const assignedStores = useAppSelector((s) => s.user.assignedStores);
  return { ...lossPrevention, apiEnv, url, token, search, assignedStores };
};
