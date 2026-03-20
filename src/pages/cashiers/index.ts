import { useEffect, useRef, useState } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";

export const useCashierCtx = () => {
  const dispatch = useAppDispatch();
  const { url, miktoUrl, apiKey, token } = useAppSelector((state) => state.app);
  const { storeCards, cashierCards, stores, cashiers, selectedStoreCard } =
    useAppSelector((state) => state.cashier);
  const { startDate, endDate, type, lastStore, lastGroup } = useAppSelector(
    (state) => state.search,
  );
  const { userid } = useAppSelector((state) => state.user);

  return {
    apiKey,
    cashierCards,
    cashiers,
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

export const useLeftColHeight = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(0);
  useEffect(() => {
    const calcHeight = () => {
      if (ref.current) {
        const { height } = ref.current.getBoundingClientRect();
        const newHeight = window.innerHeight - height - 88;
        setHeight(newHeight);
      }
    };
    calcHeight();

    window.addEventListener("resize", calcHeight);
    return () => window.removeEventListener("resize", calcHeight);
  }, []);

  return { ref, height };
};
