// Hooks
import { useMemo } from "react";
import { useAppSelector, useAppDispatch } from "../../../../hooks";

// Utils
import { getStoreName } from "../../../../utils";
import { buildTransactionLengths, buildSignals, buildTotals } from "../utils";

/** Cashiers' context: the app's connection, the search, and the slice's
 *  selected sale type, which the receipt totals by. */
export const useCashierCtx = () => {
  const dispatch = useAppDispatch();
  const { url, token, isMobile } = useAppSelector((state) => state.app);
  const { selectedSaleType } = useCashiersState();
  const { startDate, endDate, type, lastStore, lastGroup } = useAppSelector(
    (state) => state.search,
  );

  return {
    dispatch,
    endDate,
    lastGroup,
    lastStore,
    startDate,
    token,
    type,
    url,
    selectedSaleType,
    isMobile,
  };
};

export const useCashiersState = () =>
  useAppSelector((state) => state.dev.cashier);

/**
 * The explorer's derived state (exception rows, transaction lengths, totals,
 * signals) from the slice, shared by desktop and mobile so they agree.
 */
export const useCashierSignals = () => {
  const { explorerAllRows, explorerFetchedException, explorerLens } =
    useAppSelector((s) => s.dev.cashier);
  const assignedStores = useAppSelector((s) => s.user.assignedStores);

  const transactionLengths = useMemo(
    () => buildTransactionLengths(explorerAllRows),
    [explorerAllRows],
  );

  // transaction_list hands back whole receipts, so the signal maths has to run
  // on just the lines matching the exception the user picked.
  const exceptionRows = useMemo(
    () =>
      explorerAllRows.filter((r) => r.sale_type === explorerFetchedException),
    [explorerAllRows, explorerFetchedException],
  );

  const totals = useMemo(() => buildTotals(exceptionRows), [exceptionRows]);

  const signals = useMemo(
    () =>
      buildSignals(exceptionRows, transactionLengths, explorerLens, (id, fb) =>
        getStoreName(assignedStores, id, fb),
      ),
    [exceptionRows, transactionLengths, explorerLens, assignedStores],
  );

  return { exceptionRows, transactionLengths, totals, signals };
};
