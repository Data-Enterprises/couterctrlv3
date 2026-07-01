import { useAppSelector } from "../../../hooks";

export const useLPState = () =>
  useAppSelector((state) =>
    state.app.devMode ? state.lossPrevention : state.lossPreventionLegacy,
  );
