import { useAppSelector } from "../../../hooks";
import * as salesActions from "../../../features/salesSlice";
import * as salesLegacyActions from "../../../features/salesLegacySlice";

export const useSalesActions = () => {
  const devMode = useAppSelector((s) => s.app.devMode);
  return devMode ? salesActions : salesLegacyActions;
};
