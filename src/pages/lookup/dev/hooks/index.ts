// Hooks
import { useAppSelector } from "../../../../hooks";

/** Item Lookup's slice, the API connection, the user's stores and the scanner's error, read where they are used instead of passed down. */
export const useLookupCtx = () => {
  const item = useAppSelector((s) => s.dev.item);
  const { url, token } = useAppSelector((s) => s.app);
  const { assignedStores } = useAppSelector((s) => s.user);
  const { error: scanError } = useAppSelector((s) => s.itemScan);
  return { ...item, url, token, assignedStores, scanError };
};
