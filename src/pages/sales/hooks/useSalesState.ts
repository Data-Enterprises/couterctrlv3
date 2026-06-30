import { shallowEqual } from "react-redux";
import { useAppSelector } from "../../../hooks";

export const useSalesState = () => {
  const devMode = useAppSelector((s) => s.app.devMode);
  const sales = useAppSelector((s) => s.sales, shallowEqual);
  const salesLegacy = useAppSelector((s) => s.salesLegacy, shallowEqual);
  return devMode ? sales : salesLegacy;
};
