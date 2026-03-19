import { useAppSelector } from "../../hooks";

export const useCashierCtx = () => {
  const { url, miktoUrl, apiKey, token } = useAppSelector((state) => state.app);
  const { storeCards, cashierCards } = useAppSelector((state) => state.cashier);
  const { startDate, endDate } = useAppSelector((state) => state.search);

  return {
    apiKey,
    cashierCards,
    endDate,
    miktoUrl,
    startDate,
    storeCards,
    token,
    url,
  };
};
