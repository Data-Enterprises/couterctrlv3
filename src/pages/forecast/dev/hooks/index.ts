// Hooks
import { useAppSelector } from "../../../../hooks";

/** Forecasting's slice, the search and the user's stores, read where they are used instead of passed down. */
export const useForecastCtx = () => {
  const forecast = useAppSelector((s) => s.dev.forecastDev);
  const search = useAppSelector((s) => s.search);
  const assignedStores = useAppSelector((s) => s.user.assignedStores);
  return { ...forecast, search, assignedStores };
};
