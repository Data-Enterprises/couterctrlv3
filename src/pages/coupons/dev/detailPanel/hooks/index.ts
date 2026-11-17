// Hooks
import { useState } from "react";
import { useToast } from "../../../../../components/toasts/hooks/useToast";

// Redux
import {
  setCouponGridFilter,
  setCouponReceiptLines,
} from "../../../../../features/dev/devCouponSlice";

// API
import { getCashierTransaction } from "../../../../../api/lossPrevention";

// Utils
import { reasonOf } from "../../../../../utils/serverError";
import { buildSaleId, receiptTotals } from "../../utils";
import { downloadTransactionCsv } from "../utils";

// Interfaces
import type {
  CouponItem,
  ThresholdValue,
  TransactionListItem,
} from "../../../../../interfaces";
import type { GridFilters } from "../interfaces";
import type { useCouponContext } from "../../hooks";

/**
 * The grid's column filters. Applied values live in Redux, so they survive
 * leaving the page; what is typed before Apply starts from them and stays
 * local. `clear` empties both, for a change of section.
 */
export const useGridFilters = (ctx: ReturnType<typeof useCouponContext>) => {
  const { dispatch } = ctx;
  const applied = ctx.gridFilters;
  const appliedProduct = applied.product;
  const appliedUpc = applied.upc;
  const appliedSubDept = applied.subDept;
  const appliedAmount = applied.amount;
  const setAppliedProduct = (v: string) =>
    dispatch(setCouponGridFilter({ product: v }));
  const setAppliedUpc = (v: string) =>
    dispatch(setCouponGridFilter({ upc: v }));
  const setAppliedSubDept = (v: string) =>
    dispatch(setCouponGridFilter({ subDept: v }));
  const setAppliedAmount = (v: ThresholdValue | null) =>
    dispatch(setCouponGridFilter({ amount: v }));
  const [draftProduct, setDraftProduct] = useState<string>(appliedProduct);
  const [draftUpc, setDraftUpc] = useState<string>(appliedUpc);
  const [draftSubDept, setDraftSubDept] = useState<string>(appliedSubDept);
  const [draftAmount, setDraftAmount] = useState<ThresholdValue | null>(
    appliedAmount,
  );

  const clear = () => {
    setDraftProduct("");
    setAppliedProduct("");
    setDraftUpc("");
    setAppliedUpc("");
    setDraftSubDept("");
    setAppliedSubDept("");
    setDraftAmount(null);
    setAppliedAmount(null);
  };

  // Everything the grid's column filters need but the sub-dept options, which
  // follow the rows on screen.
  const bundle: Omit<GridFilters, "uniqueSubDeptOptions"> = {
    draftUpc,
    setDraftUpc,
    appliedUpc,
    setAppliedUpc,
    draftProduct,
    setDraftProduct,
    appliedProduct,
    setAppliedProduct,
    draftSubDept,
    setDraftSubDept,
    appliedSubDept,
    setAppliedSubDept,
    draftAmount,
    setDraftAmount,
    appliedAmount,
    setAppliedAmount,
  };

  return {
    bundle,
    applied: {
      product: appliedProduct,
      upc: appliedUpc,
      subDept: appliedSubDept,
      amount: appliedAmount,
    },
    clear,
  };
};

/**
 * The receipt a grid row opens: which sale is open, fetching its lines, Back,
 * the CSV, and its totals.
 */
export const useCouponReceipt = (ctx: ReturnType<typeof useCouponContext>) => {
  const toast = useToast();
  const { dispatch } = ctx;
  const [selectedSaleId, setSelectedSaleId] = useState<string>("");

  const txLines: TransactionListItem[] = ctx.receiptLines;
  const txMeta = txLines[0] ?? null;

  const handleRowClick = (row: CouponItem) => {
    const saleId = buildSaleId(row);
    if (saleId === selectedSaleId) return;
    setSelectedSaleId(saleId);
    dispatch(setCouponReceiptLines([]));
    getCashierTransaction(
      ctx.url,
      ctx.token,
      row.sale_date,
      saleId,
      row.storeid,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const transactions = [...j.transaction].map((item) => ({
            ...item,
            transaction_id: item.sale_id.split("-")[1],
            qty: item.qty ?? 0,
          }));
          dispatch(setCouponReceiptLines(transactions));
        }
      })
      .catch((err) => toast.error(reasonOf(err)));
  };

  const handleBack = () => {
    setSelectedSaleId("");
    dispatch(setCouponReceiptLines([]));
  };

  const exportTransaction = () => {
    if (!txLines.length) return;
    downloadTransactionCsv(txLines, txMeta);
  };

  return {
    selectedSaleId,
    setSelectedSaleId,
    txLines,
    txMeta,
    totals: receiptTotals(txLines),
    handleRowClick,
    handleBack,
    exportTransaction,
  };
};
