import { useAppSelector } from "../../../hooks";

export const useCashiersState = () =>
  useAppSelector((state) =>
    state.app.devMode ? state.cashier : state.cashierLegacy,
  );
