import { useAppSelector } from "../../../hooks";
import * as subMarginActions from "../../../features/subMarginSlice";
import * as subMarginLegacyActions from "../../../features/subMarginLegacySlice";

export const useSubMarginActions = () => {
  const devMode = useAppSelector((s) => s.app.devMode);
  return devMode ? subMarginActions : subMarginLegacyActions;
};
