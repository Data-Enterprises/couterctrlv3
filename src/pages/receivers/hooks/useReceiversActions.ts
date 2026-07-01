import { useAppSelector } from "../../../hooks";
import * as receiversActions from "../../../features/receiversSlice";
import * as receiversLegacyActions from "../../../features/receiversLegacySlice";

export const useReceiversActions = () => {
  const devMode = useAppSelector((s) => s.app.devMode);
  return devMode ? receiversActions : receiversLegacyActions;
};
