import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { getHistoryFromList } from "../../../api/priceSim";
import { getStoresAssignedToUserGroup } from "../../../api/groups";
import { setSelectedGroupStores } from "../../../features/userSlice";
import { enrichForecastRows } from "../enrichRows";
import {
  reQuery,
  setIsLoading,
  setIsLoadingMore,
  setItems,
  setForecastResults,
  setSingleResults,
  setRowData,
  setNoResults,
  setNotFoundUpcs,
  appendNotFoundUpcs,
  appendBatchResults,
  setStoreids,
} from "../../../features/forecastDevSlice";
import ForecastEntry from "./ForecastEntry";
import ForecastListPanel from "./ForecastListPanel";
import ForecastRowsTable from "./ForecastRowsTable";
import ForecastCalcModal from "./ForecastCalcModal";
import ForecastExportModal from "./ForecastExportModal";
import Forecasting from "../Forecasting";
import type { JsonError, PriceHistoryFromListResp } from "../../../interfaces";

/** The API takes 500 UPCs at a time; a longer list is split so the first page
 *  of results is on screen while the rest is still in flight. */
const BATCH_SIZE = 500;

const ForecastDev = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token, isTablet, isDesktop } = useAppSelector((s) => s.app);
  const { type, lastStore, lastGroup, singleDate } = useAppSelector(
    (s) => s.search,
  );
  const { userid } = useAppSelector((s) => s.user);
  const { rowData, isLoading, noResults, upcs, adListRows } = useAppSelector(
    (s) => s.forecastDev,
  );

  const [exportOpen, setExportOpen] = useState(false);
  // Once rows are on screen the search card becomes an overlay rather than
  // taking the page back — same as every other page that searches.
  const [searchOpen, setSearchOpen] = useState(false);

  /* Same request sequence the legacy page runs — two batches, the second
     appended rather than replacing the first — pointed at the dev slice. */
  /** A group is a list of stores to this endpoint, so it has to be resolved
   *  before the call rather than passed through as an id. Inactive stores are
   *  dropped — their history has stopped being added to. */
  const resolveStoreids = async (): Promise<string> => {
    if (type !== "Group") return String(lastStore);
    const resp = await getStoresAssignedToUserGroup(url, token, userid, lastGroup);
    const stores = (resp.data.stores ?? []).filter(
      (s: { active: number | boolean }) => Boolean(s.active),
    );
    dispatch(setSelectedGroupStores(stores));
    return stores.map((s: { storeid: number }) => s.storeid).join(",");
  };

  const handleSearch = async () => {
    setSearchOpen(false);
    dispatch(setIsLoading(true));
    dispatch(reQuery());

    let storeids = "";
    try {
      storeids = await resolveStoreids();
    } catch {
      dispatch(setIsLoading(false));
      toast.error("Couldn't load the stores for that group.");
      return;
    }
    if (!storeids) {
      dispatch(setIsLoading(false));
      toast.warn("Pick a store or group first.");
      return;
    }
    dispatch(setStoreids(storeids));

    // `singleDate` is already mm/dd/yyyy, which is what this endpoint wants.
    // Don't run it through formatGoliathDate — the ISO form other pages send
    // comes back as "400: Invalid date formats".
    const batch1 = upcs.slice(0, BATCH_SIZE);
    const batch2 = upcs.slice(BATCH_SIZE);

    getHistoryFromList(url, token, storeids, singleDate, batch1.join(","))
      .then((resp) => {
        const j: PriceHistoryFromListResp = resp.data;
        // A failed request is not the same as an item having no history. The
        // card's notice claims the UPCs came back empty, which would be a lie
        // here — the search never ran. Show the backend's own reason verbatim:
        // "400: failed to write to s3 bucket" is something to go fix, and no
        // rewording of ours carries that.
        if (j.error === 1) {
          toast.warn(j.msg || "Couldn't load price history.");
          return;
        }
        if (j.results.length > 0) {
          const { rows, singlePrices, enrichedResults } = enrichForecastRows(
            j.results,
            adListRows,
          );
          const returned = new Set(j.results.map((r) => r.upc));
          dispatch(
            setItems(
              enrichedResults.map((i) => ({
                upc: i.upc,
                description: i.description,
              })),
            ),
          );
          dispatch(setForecastResults(enrichedResults));
          dispatch(setSingleResults(singlePrices));
          dispatch(setRowData(rows));
          dispatch(setNotFoundUpcs(batch1.filter((u) => !returned.has(u))));
        } else {
          dispatch(setNoResults(true));
          dispatch(setNotFoundUpcs(batch1));
        }

        if (batch2.length === 0) return;

        dispatch(setIsLoadingMore(true));
        getHistoryFromList(url, token, storeids, singleDate, batch2.join(","))
          .then((resp2) => {
            const j2: PriceHistoryFromListResp = resp2.data;
            if (j2.error === 1) {
              dispatch(setIsLoadingMore(false));
              toast.warn(
                j2.msg
                  ? `Second batch failed — ${j2.msg}`
                  : "Some items could not be loaded — partial results shown.",
              );
              return;
            }
            if (j2.results.length > 0) {
              const {
                rows: rows2,
                singlePrices: single2,
                enrichedResults: enriched2,
              } = enrichForecastRows(j2.results, adListRows);
              const returned2 = new Set(j2.results.map((r) => r.upc));
              dispatch(
                appendBatchResults({
                  rows: rows2,
                  results: enriched2,
                  singleResults: single2,
                  items: enriched2.map((i) => ({
                    upc: i.upc,
                    description: i.description,
                  })),
                }),
              );
              dispatch(
                appendNotFoundUpcs(batch2.filter((u) => !returned2.has(u))),
              );
            } else {
              dispatch(setIsLoadingMore(false));
              dispatch(appendNotFoundUpcs(batch2));
            }
          })
          .catch(() => {
            dispatch(setIsLoadingMore(false));
            toast.warn("Some items could not be loaded — partial results shown.");
          });
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(setIsLoading(false)));
  };

  // Desktop-only refactor — tablet and mobile fall through to the legacy page,
  // which owns its own tablet branch.
  if (isTablet || !isDesktop) return <Forecasting />;

  const hasData = rowData.length > 0;

  return (
    <div
      data-testid="forecast-dev-page"
      className={`h-[calc(100vh-3rem)] w-full overflow-hidden${hasData ? " p-4" : ""}`}
    >
      {hasData ? (
        <>
          <ForecastCalcModal />
          {exportOpen && (
            <ForecastExportModal onClose={() => setExportOpen(false)} />
          )}
          <div className="flex gap-3 h-full">
            <ForecastListPanel onReSearch={() => setSearchOpen(true)} />
            <ForecastRowsTable onExportClick={() => setExportOpen(true)} />
          </div>

          {searchOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
              onClick={() => setSearchOpen(false)}
            >
              {/* Wrapper only shrink-wraps the card — the backdrop does the
                  centering, or its stopPropagation would eat every backdrop
                  click. Matches UpcListDev. */}
              <div className="mx-4" onClick={(e) => e.stopPropagation()}>
                <ForecastEntry
                  onSearch={handleSearch}
                  isLoading={isLoading}
                  onClose={() => setSearchOpen(false)}
                />
              </div>
            </div>
          )}
        </>
      ) : (
        <ForecastEntry
          onSearch={handleSearch}
          isLoading={isLoading}
          notice={
            noResults
              ? "No price history came back for those UPCs at the selected stores."
              : undefined
          }
        />
      )}
    </div>
  );
};

export default ForecastDev;
