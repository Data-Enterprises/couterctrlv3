import { useMemo } from "react";
import { useAppSelector } from "../../hooks";
import { getStoreName } from "../../utils";
import {
  buildTransactionLengths,
  buildSignals,
  buildTotals,
} from "./explorer/lensUtils";

/**
 * The explorer's derived state — exception rows, transaction lengths, totals
 * and signals — off whatever the slice currently holds.
 *
 * Lifted out of `Cashiers.tsx` so the mobile explorer reads the same figures
 * from the same maths. The desktop had it inline; a second copy would have been
 * the kind of thing that silently drifts once a lens or a spread rule changes.
 */
export const useCashierSignals = () => {
  const { explorerAllRows, explorerFetchedException, explorerLens } =
    useAppSelector((s) => s.cashier);
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
