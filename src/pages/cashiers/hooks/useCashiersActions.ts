import { useAppSelector } from "../../../hooks";
import * as cashiersActions from "../../../features/cashiersSlice";
import * as cashiersLegacyActions from "../../../features/cashiersLegacySlice";

export const useCashiersActions = () => {
  const devMode = useAppSelector((s) => s.app.devMode);
  return devMode ? cashiersActions : cashiersLegacyActions;
};
