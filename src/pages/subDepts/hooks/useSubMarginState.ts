import { useAppSelector } from "../../../hooks";

export const useSubMarginState = () =>
  useAppSelector((state) =>
    state.app.devMode ? state.subMargin : state.subMarginLegacy,
  );
