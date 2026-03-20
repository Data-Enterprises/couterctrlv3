import { useAppSelector, useAppDispatch } from "../../hooks";

export const useCashierCtx = () => {
  const dispatch = useAppDispatch();
  const { url, miktoUrl, apiKey, token } = useAppSelector((state) => state.app);
  const { storeCards, cashierCards, stores, cashiers, selectedStoreCard, dataView } =
    useAppSelector((state) => state.cashier);
  const { startDate, endDate, type, lastStore, lastGroup } = useAppSelector(
    (state) => state.search,
  );
  const { userid } = useAppSelector((state) => state.user);

  return {
    apiKey,
    cashierCards,
    cashiers,
    dataView,
    dispatch,
    endDate,
    lastGroup,
    lastStore,
    miktoUrl,
    selectedStoreCard,
    startDate,
    storeCards,
    stores,
    token,
    type,
    url,
    userid,
  };
};
