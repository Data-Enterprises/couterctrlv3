import { useAppSelector, useAppDispatch } from "../../hooks";

export const useCashierCtx = () => {
  const dispatch = useAppDispatch();
  const { url, miktoUrl, apiKey, token } = useAppSelector((state) => state.app);
  const { storeCards, cashierCards } = useAppSelector((state) => state.cashier);
  const { startDate, endDate, type } = useAppSelector((state) => state.search);
  const { userid } = useAppSelector((state) => state.user);

  return {
    apiKey,
    cashierCards,
    dispatch,
    endDate,
    miktoUrl,
    startDate,
    storeCards,
    token,
    type,
    url,
    userid,
  };
};
