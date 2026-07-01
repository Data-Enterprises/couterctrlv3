import { useAppSelector } from "../../../hooks";
import * as lpActions from "../../../features/lossPreventionSlice";
import * as lpLegacyActions from "../../../features/lossPreventionLegacySlice";

export const useLPActions = () => {
  const devMode = useAppSelector((s) => s.app.devMode);
  return devMode ? lpActions : lpLegacyActions;
};
