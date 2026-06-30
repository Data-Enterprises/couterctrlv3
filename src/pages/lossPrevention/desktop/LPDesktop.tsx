import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { useApiContext } from "../../hooks";
import { formatGoliathDate } from "../../../utils";
import {
  getCashierDetails,
  getCashierTable,
  getTransactionList,
  getCashierTransaction,
} from "../../../api/lossPrevention";
import {
  reQuery,
  resetCashierSlice,
  setCashierDetails,
  setCashierTrends,
  setCashiers,
  setFetchingCashierTransactions,
  setSelectedCashierDetails,
  setSelectedSaleIds,
  setSelectedSaleType,
  setSelectedStoreId,
  setSaleTypes,
  setTransList,
  setTransModalOpen,
  setTransOverviews,
  setBaselineOverviews,
  setBaselineDetails,
  setTransactionDrillDown,
  setTransactionLoadingMessage,
  toggleNoTransMsg,
  // setSearchString, // Description logic commented out
} from "../../../features/lossPreventionSlice";
import type { CashierDetails, JsonError, TransactionListItem, TransactionOverview, UniqueCashier } from "../../../interfaces";
import { chunkSales } from "..";
import SearchCard from "../../../components/SearchCard";
// import DescModal from "../components/DescModal"; // Description logic commented out
import LPStorePanel from "./LPStorePanel";
import LPTransactionPanel from "./LPTransactionPanel";

interface Props {
  getSaleTypes: () => void;
}

const LPDesktop = ({ getSaleTypes }: Props) => {
  const toast = useToast();
  const params = useApiContext();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((s) => s.app);
  const search = useAppSelector((s) => s.search);
  const cashier = useAppSelector((s) => s.lossPrevention);
  const [loading, setLoading] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  useEffect(() => {
    if (cashier.saleTypes.length > 0 && !cashier.selectedSaleType && cashier.cashierDetails.length === 0) {
      handleSaleTypeSelect(cashier.saleTypes[0].sale_type);
    }
  }, [cashier.saleTypes]);
  // const [descModalOpen, setDescModalOpen] = useState(false);

  const handleSaleTypeSelect = (saleType: string) => {
    // Description exception logic commented out until further notice
    // if (saleType === "Description") {
    //   setDescModalOpen(true);
    //   return;
    // }
    const panels = cashier.saleTypes;
    dispatch(setSelectedStoreId(0));
    dispatch(setCashierTrends([]));
    dispatch(setCashierDetails([]));
    dispatch(reQuery());
    dispatch(setSaleTypes(panels));
    dispatch(setSelectedSaleType(saleType));
    setLoading(true);

    getCashierDetails(
      params.url, params.token,
      params.lpStart, params.lpEnd,
      params.useGroups, params.searchValue, params.singleStore,
      [saleType],
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          if (j.sales.length === 0) {
            dispatch(toggleNoTransMsg(true));
          } else {
            dispatch(toggleNoTransMsg(false));
            dispatch(setCashierDetails(j.sales));
            dispatch(setCashierTrends(j.trend));
          }
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => setLoading(false));
    getCashierDetails(params.url, params.token, params.lpBaseStart, params.lpBaseEnd, params.useGroups, params.searchValue, params.singleStore, [saleType])
      .then((r) => { if (r.data.error === 0) dispatch(setBaselineDetails(r.data.sales)); })
      .catch(() => {});
  };

  // Description submit handler — commented out until further notice
  // const handleDescriptionSubmit = (description: string) => {
  //   setDescModalOpen(false);
  //   const panels = cashier.saleTypes;
  //   dispatch(resetCashierSlice());
  //   dispatch(setSaleTypes(panels));
  //   dispatch(setSearchString(description));
  //   dispatch(setSelectedSaleType("Description"));
  //   setLoading(true);
  //   getCashierDetails(params.url, params.token, params.start, params.end, params.useGroups, params.searchValue, params.singleStore, ["description"], description)
  //     .then((resp) => {
  //       const j = resp.data;
  //       if (j.error === 0 && j.sales.length > 0) {
  //         dispatch(toggleNoTransMsg(false));
  //         dispatch(setCashierDetails(j.sales));
  //         dispatch(setCashierTrends(j.trend));
  //       } else {
  //         dispatch(toggleNoTransMsg(true));
  //       }
  //     })
  //     .catch((err: JsonError) => toast.error(err.message))
  //     .finally(() => setLoading(false));
  // };

  const fetchTransactions = (saleIds: string[], saleType: string) => {
    dispatch(setTransactionLoadingMessage("Loading Transactions..."));
    getTransactionList(url, token, saleIds, 1, saleType, cashier.searchString)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const newTrans = [...j.transactions];
          const uniqueCashiers = newTrans.reduce((acc: UniqueCashier[], curr) => {
            const found = acc.find((item) => item.cashier_number === curr.cashier_number);
            if (!found) {
              acc.push({
                cashier_name: curr.cashier_name,
                cashier_number: curr.cashier_number,
                total_sales: curr.total_sales,
                transaction_count: 1,
                store_number: curr.store_number,
                transaction_ids: [curr.sale_id],
              });
            } else {
              if (!found.transaction_ids.includes(curr.sale_id)) {
                found.transaction_ids.push(curr.sale_id);
                found.transaction_count += 1;
              }
              found.total_sales += curr.total_sales;
            }
            return acc;
          }, []);

          dispatch(setCashiers(uniqueCashiers));

          const formatted: TransactionListItem[] = newTrans.map((item) => ({
            ...item,
            transaction_id: item.sale_id.split("-")[1],
            sale_date: item.sale_date.split("T")[0],
            qty: item.qty ?? 0,
          }));

          const overviews: TransactionOverview[] = formatted.reduce((acc: TransactionOverview[], curr) => {
            const found = acc.find((item) => item.transaction_id === curr.transaction_id);
            if (!found) {
              acc.push({
                transaction_id: curr.transaction_id,
                sale_date: curr.sale_date,
                sale_type: curr.sale_type,
                store_number: curr.store_number,
                cashier_name: curr.cashier_name,
                cashier_number: curr.cashier_number,
                qty: 1,
                total_sales: curr.total_sales,
                sale_id: curr.sale_id,
                storeid: curr.storeid,
              });
            } else {
              found.qty += 1;
              found.total_sales += curr.total_sales;
            }
            return acc;
          }, []);

          dispatch(setTransOverviews(overviews));
          dispatch(setTransList(formatted));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => {
        dispatch(setFetchingCashierTransactions(false));
        dispatch(setTransactionLoadingMessage(""));
      });
  };

  const handleStoreSelect = (detail: CashierDetails) => {
    if (cashier.selectedStoreId === detail.storeid) return;

    dispatch(reQuery());
    dispatch(setTransactionLoadingMessage("Loading Cashiers..."));
    dispatch(setSelectedStoreId(detail.storeid));
    dispatch(setSelectedCashierDetails(detail));
    dispatch(setFetchingCashierTransactions(true));
    dispatch(setTransList([]));

    // const saleType = cashier.selectedSaleType === "Description" ? "description" : cashier.selectedSaleType;
    const saleType = cashier.selectedSaleType;
    const [sm, sd, sy] = search.singleDate.split("/").map(Number);
    const endD      = new Date(sy, sm - 1, sd);
    const startD    = new Date(endD);   startD.setDate(startD.getDate() - 6);
    const baseEndD  = new Date(endD);   baseEndD.setDate(baseEndD.getDate() - 7);
    const baseStartD = new Date(endD);  baseStartD.setDate(baseStartD.getDate() - 20);
    const fmt = (d: Date) => formatGoliathDate(`${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`);
    const start     = fmt(startD);
    const end       = fmt(endD);
    const baseStart = fmt(baseStartD);
    const baseEnd   = fmt(baseEndD);

    getCashierTable(url, token, start, end, 0, detail.storeid, 1, [saleType], 1, cashier.searchString)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const transactions = [...j.transactions];
          const allTrans = transactions.filter((item) => item.sale_type === saleType);

          if (j.total_pages > 1) {
            const pages: { page: number; fetched: boolean }[] = [];
            for (let page = 2; page <= j.total_pages; page++) {
              pages.push({ page, fetched: false });
            }
            for (let page = 2; page <= j.total_pages; page++) {
              getCashierTable(url, token, start, end, 0, detail.storeid, 1, [saleType], page, cashier.searchString)
                .then((resp) => {
                  const j = resp.data;
                  if (j.error === 0) {
                    allTrans.push(...j.transactions.filter((t: any) => t.sale_type === saleType));
                    pages.find((p) => p.page === page)!.fetched = true;
                    if (pages.every((p) => p.fetched)) {
                      const saleIds = Array.from(new Set(allTrans.map((t) => t.sale_id)));
                      fetchTransactions(saleIds, saleType);
                    }
                  }
                });
            }
          } else {
            const saleIds = Array.from(new Set(transactions.map((item) => item.sale_id)));
            dispatch(setSelectedSaleIds(saleIds));
            fetchTransactions(saleIds, saleType);
          }
        }
      })
      .catch((err: JsonError) => toast.error(err.message));

    // Baseline fetch — prior 2 weeks, used for cashier grading
    getCashierTable(url, token, baseStart, baseEnd, 0, detail.storeid, 1, [saleType], 1, cashier.searchString)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const baseTrans = j.transactions.filter((t: any) => t.sale_type === saleType);
          const fetchPages = j.total_pages > 1
            ? Array.from({ length: j.total_pages - 1 }, (_, i) =>
                getCashierTable(url, token, baseStart, baseEnd, 0, detail.storeid, 1, [saleType], i + 2, cashier.searchString)
                  .then((r) => r.data.error === 0 ? r.data.transactions.filter((t: any) => t.sale_type === saleType) : [])
              )
            : [];
          Promise.all(fetchPages).then((pages) => {
            pages.forEach((p) => baseTrans.push(...p));
            const overviews: TransactionOverview[] = baseTrans.reduce((acc: TransactionOverview[], curr: any) => {
              const found = acc.find((o) => o.transaction_id === curr.sale_id.split("-")[1]);
              if (!found) {
                acc.push({ transaction_id: curr.sale_id.split("-")[1], sale_date: curr.sale_date.split("T")[0], sale_type: curr.sale_type, store_number: curr.store_number, cashier_name: curr.cashier_name, cashier_number: curr.cashier_number, qty: 1, total_sales: curr.total_sales, sale_id: curr.sale_id, storeid: curr.storeid });
              } else {
                found.qty += 1;
                found.total_sales += curr.total_sales;
              }
              return acc;
            }, []);
            dispatch(setBaselineOverviews(overviews));
          });
        }
      })
      .catch(() => { /* baseline failure is non-fatal */ });
  };

  const handleTransactionClick = (overview: TransactionOverview) => {
    const saleDate = overview.sale_date.split("T")[0];
    dispatch(setTransactionDrillDown([]));
    getCashierTransaction(url, token, saleDate, overview.sale_id, overview.storeid)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const transactions: TransactionListItem[] = [...j.transaction].map((item) => ({
            ...item,
            transaction_id: item.sale_id.split("-")[1],
            qty: item.qty ?? 0,
          }));
          dispatch(setTransactionDrillDown([transactions]));
        }
      })
      .catch((err: JsonError) => {
        dispatch(setTransModalOpen(false));
        toast.error(err.message);
      });
  };

  const handleShowAll = (filtered: TransactionListItem[]) => {
    const chunked = chunkSales(filtered);
    dispatch(setTransactionDrillDown(chunked));
    dispatch(setTransModalOpen(true));
  };

  if (!cashier.saleTypes.length) {
    return (
      <div className="h-[calc(100vh-3rem)] overflow-hidden flex items-center justify-center bg-bkg">
        <div className="w-full max-w-sm mx-4">
          <SearchCard
            title="Loss Prevention"
            description="Select a store and date to find exception activity."
            buttonLabel="Load exceptions"
            singleDate={true}
            onSearch={getSaleTypes}
            loading={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3rem)] overflow-hidden p-4 flex gap-4">
      {/* <DescModal open={descModalOpen} onClose={() => setDescModalOpen(false)} handleSubmit={handleDescriptionSubmit} /> */}
      <LPStorePanel
        loading={loading}
        onSaleTypeSelect={handleSaleTypeSelect}
        onStoreSelect={handleStoreSelect}
        onOpenSearch={() => setSearchModalOpen(true)}
      />
      <LPTransactionPanel
        onTransactionClick={handleTransactionClick}
        onShowAll={handleShowAll}
      />
      {searchModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSearchModalOpen(false)}
        >
          <div className="w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <SearchCard
              title="Loss Prevention"
              description="Select a store and date to find exception activity."
              buttonLabel="Load exceptions"
              singleDate={true}
              onSearch={() => { setSearchModalOpen(false); dispatch(resetCashierSlice()); getSaleTypes(); }}
              loading={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LPDesktop;
