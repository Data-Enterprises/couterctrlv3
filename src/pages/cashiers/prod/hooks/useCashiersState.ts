import { useAppSelector } from "../../../../hooks";

export const useCashiersState = () =>
  useAppSelector((state) => state.prod.cashier);
