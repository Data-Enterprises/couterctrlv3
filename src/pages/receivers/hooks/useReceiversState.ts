import { useAppSelector } from "../../../hooks";

export const useReceiversState = () =>
  useAppSelector((state) =>
    state.app.devMode ? state.receivers : state.receiversLegacy,
  );
