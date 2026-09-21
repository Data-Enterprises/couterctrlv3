import { useAppSelector } from "../../../../hooks";

export const useCashiersState = () =>
  useAppSelector((state) => state.dev.cashier);
