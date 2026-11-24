// Hooks
import { useState } from "react";
import { useToast } from "../../../../../components/toasts/hooks/useToast";
import { useCouponSalesCtx } from "../../hooks";

// Redux
import { setCouponReceiptLines } from "../../../../../features/dev/devCouponSalesSlice";

// API
import { getCashierTransaction } from "../../../../../api/lossPrevention";

// Utils
import { downloadCsv } from "../../../../../utils/csvExport";
import { reasonOf } from "../../../../../utils/serverError";
import { type CouponTransaction } from "../../utils";
import { transactionCsv } from "../utils";

// Interfaces
import type { TransactionListItem } from "../../../../../interfaces";

/**
 * The receipt the right pane shows: which sale is open, fetching its lines,
 * Back, and its CSV.
 */
export const useCpnSalesReceipt = () => {
  const toast = useToast();
  const { dispatch, url, token, receiptLines: txLines } = useCouponSalesCtx();

  // Which transaction the right pane is showing, if any. Local like dev
  // Coupons' own selectedSaleId — it's view state for one pane, not something
  // a re-search or another panel needs to read.
  const [openSaleId, setOpenSaleId] = useState<string>("");

  // Fetches the whole receipt from LP's endpoint and renders it in place. The
  // coupons/ payload only carries the coupon lines, so on its own it can't
  // show what the discount was actually applied against.
  const openTransaction = (t: CouponTransaction) => {
    const saleDate = t.rawSaleDate.split("T")[0];
    const [y, m, d] = saleDate.split("-");
    const joinedSaleId = `${t.storeid}-${t.sale_id}-${t.terminal}-${parseInt(m)}-${parseInt(d)}-${y}`;
    if (joinedSaleId === openSaleId) return;

    setOpenSaleId(joinedSaleId);
    dispatch(setCouponReceiptLines([]));
    getCashierTransaction(url, token, saleDate, joinedSaleId, t.storeid)
      .then((resp) => {
        const j = resp.data;
        if (j.error !== 0) return;
        const lines: TransactionListItem[] = [...j.transaction].map(
          (item: TransactionListItem) => ({
            ...item,
            transaction_id: item.sale_id.split("-")[1],
            qty: item.qty ? item.qty : 0,
          }),
        );
        dispatch(setCouponReceiptLines(lines));
      })
      .catch((err) => {
        setOpenSaleId("");
        toast.error("Error fetching transaction: " + reasonOf(err));
      });
  };

  const handleBackFromTransaction = () => {
    setOpenSaleId("");
    dispatch(setCouponReceiptLines([]));
  };

  const exportTransaction = () => {
    if (!txLines.length) return;
    const { csv, filename } = transactionCsv(txLines);
    downloadCsv(csv, filename);
  };

  return {
    openSaleId,
    setOpenSaleId,
    openTransaction,
    handleBackFromTransaction,
    exportTransaction,
  };
};
