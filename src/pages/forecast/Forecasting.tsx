import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";

import { useToast } from "../../components/toasts/hooks/useToast";
// import SingleSelect from "../../components/SingleSelect";
import { getStoresAssignedToUserGroup } from "../../api/groups";
import type {
  JsonError,
  Store,
  PriceHistoryFromListResp,
} from "../../interfaces";
import type { Group, StoreWithGroupStatus } from "../../features/groupSlice";
import {
  reQuery,
  setIsLoading,
  setItems,
  setRadioId,
  setSelectedStores,
  setInitialRowData,
  setForecastResults,
  setSingleForecastResults,
  setNoResults,
  setIsLoadingMore,
  appendBatchResults,
  setNotFoundUpcs,
  appendNotFoundUpcs,
} from "../../features/forecastSlice";
import { useForecastContext, useResizeContext } from "./hooks";
import ForecastControls from "./controls/ForecastControls";
import OutlierGrid from "./grids/OutlierGrid";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import ForecastModal from "./controls/ForecastModal";
import { getHistoryFromList } from "../../api/priceSim";
import {
  removeSingleUpc,
  setUpcs,
  setUpcText,
} from "../../features/upcUploadSlice";
import ForecastCarousel from "./carousel/ForecastCarousel";
import { enrichForecastRows } from "./enrichRows";
import ForecastTablet from "./tablet/ForecastTablet";
import ForecastSetupWizard from "./controls/ForecastSetupWizard";
import ForecastSettingsModal from "./controls/ForecastSettingsModal";

const Forecasting = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useForecastContext();
  useResizeContext("");
  const [_, setFile] = useState<File | null>(null);
  const [filteredData, setFilteredData] = useState<Store[] | Group[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showItemsPanel, setShowItemsPanel] = useState(true);
  const { upcs, upcText } = useAppSelector((state) => state.upcs);
  const adListRows = useAppSelector((state) => state.adList.rows);
  const { initialRowData, isLoading, noResults } = useAppSelector(
    (state) => state.forecast,
  );

  useEffect(() => {
    if (context.radioId === 0) {
      dispatch(setRadioId(1));
      setFilteredData(context.assignedStores);
    } else if (context.radioId === 1) {
      setFilteredData(context.assignedStores);
    } else if (context.radioId === 2) {
      setFilteredData(context.groups);
    }
  }, [context.radioId]);

  const BATCH_SIZE = 500;

  /** Shared with the dev page — see `enrichRows.ts`. */
  const enrichRows = (results: PriceHistoryFromListResp["results"]) =>
    enrichForecastRows(results, adListRows);

  const handleSearch = () => {
    if (context.storeids.length === 0) {
      toast.warn("Please select at least one store");
      return;
    }
    if (upcs.length === 0) {
      toast.warn("Please add at least one UPC");
      return;
    }

    if (settingsOpen) setSettingsOpen(false);
    dispatch(setIsLoading(true));
    dispatch(reQuery());

    const batch1 = upcs.slice(0, BATCH_SIZE);
    const batch2 = upcs.slice(BATCH_SIZE);

    getHistoryFromList(
      context.url,
      context.token,
      context.storeids,
      context.endDate,
      batch1.join(","),
    )
      .then((resp) => {
        const j: PriceHistoryFromListResp = resp.data;
        if (j.error === 0 && j.results.length > 0) {
          const { rows, singlePrices, enrichedResults } = enrichRows(j.results);
          const returnedSet = new Set(j.results.map((r) => r.upc));
          const upcItems = enrichedResults.map((item) => ({ upc: item.upc, description: item.description }));
          dispatch(setItems(upcItems));
          dispatch(setForecastResults(enrichedResults));
          dispatch(setSingleForecastResults(singlePrices));
          dispatch(setInitialRowData(rows));
          dispatch(setNotFoundUpcs(batch1.filter((u) => !returnedSet.has(u))));
        } else {
          dispatch(setNoResults(true));
          dispatch(setNotFoundUpcs(batch1));
        }

        if (batch2.length === 0) return;

        dispatch(setIsLoadingMore(true));
        getHistoryFromList(
          context.url,
          context.token,
          context.storeids,
          context.endDate,
          batch2.join(","),
        )
          .then((resp2) => {
            const j2: PriceHistoryFromListResp = resp2.data;
            if (j2.error === 0 && j2.results.length > 0) {
              const { rows: rows2, singlePrices: single2, enrichedResults: enriched2 } = enrichRows(j2.results);
              const returned2 = new Set(j2.results.map((r) => r.upc));
              const items2 = enriched2.map((item) => ({ upc: item.upc, description: item.description }));
              dispatch(appendBatchResults({
                rows: rows2,
                results: enriched2,
                singleResults: single2,
                items: items2,
              }));
              dispatch(appendNotFoundUpcs(batch2.filter((u) => !returned2.has(u))));
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

  const handleSelectChange = (id: string | number) => {
    dispatch(setSelectedStores([]));
    dispatch(setRadioId(id as number));
    if (id === 1) setFilteredData(context.assignedStores);
    else if (id === 2) setFilteredData(context.groups);
  };

  const handleSelectClick = (id: string | number) => {
    if (context.radioId === 1) {
      const store = filteredData.find(
        (item): item is Store => "storeid" in item && item.storeid === id,
      );
      const existingStore = context.selectedStores.find(
        (s) => s.storeid === id,
      );
      if (existingStore) {
        dispatch(
          setSelectedStores(
            [...context.selectedStores].filter((s) => s.storeid !== id),
          ),
        );
      } else if (store) {
        dispatch(setSelectedStores([...context.selectedStores, store]));
      }
    } else if (context.radioId === 2) {
      getStoresAssignedToUserGroup(
        context.url,
        context.token,
        context.userid,
        Number(id),
      )
        .then((resp) => {
          const filtered = [...resp.data.stores].filter(
            (s: StoreWithGroupStatus) => s.active === 1,
          );
          dispatch(setSelectedStores(filtered));
        })
        .catch((err: JsonError) => toast.error(err.message));
    }
  };

  const handleAddUpc = (upc: string) => {
    if (upc === "") {
      dispatch(setUpcs([]));
      return;
    }
    dispatch(setUpcs(upc.split(",").map((u) => u.trim())));
  };

  const handleEnterDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAddUpc(e.currentTarget.value);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setUpcText(e.currentTarget.value));
  };

  const handleRemoveUpc = (upc: string) => {
    dispatch(removeSingleUpc(upc));
  };

  const wizardProps = {
    radioId: context.radioId,
    filteredData,
    selectedStores: context.selectedStores,
    storeids: context.storeids,
    upcs,
    upcText,
    isLoading,
    noResults,
    endDate: context.endDate,
    onSelectChange: handleSelectChange,
    onSelectClick: handleSelectClick,
    onTextChange: handleTextChange,
    onAddUpc: handleAddUpc,
    onRemoveUpc: handleRemoveUpc,
    onEnterDown: handleEnterDown,
    onSearch: handleSearch,
    setFile,
  };

  if (context.isTablet)
    return (
      <ForecastTablet
        handleSelectChange={handleSelectChange}
        filteredData={filteredData}
        handleSearch={handleSearch}
        handleSelectClick={handleSelectClick}
        handleTextChange={handleTextChange}
        handleAddUpc={handleAddUpc}
        handleRemoveUpc={handleRemoveUpc}
        setFile={setFile}
      />
    );

  const hasData = initialRowData.length > 0;

  return (
    <div
      data-testid="forecast-page"
      className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] relative w-full overflow-hidden"
    >
      <ForecastModal />
      <ForecastSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        {...wizardProps}
      />

      <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] p-4 gap-2 overflow-hidden">
        {hasData ? (
          // ── Data loaded: full-width grid view ──
          <div className="flex flex-col flex-1 min-h-0 gap-2">
            <ForecastCarousel
              onItemsToggle={() => setShowItemsPanel((p) => !p)}
              showItemsPanel={showItemsPanel}
            />
            <div
              className={`flex-1 min-h-0 grid gap-2 overflow-hidden ${
                showItemsPanel ? "grid-cols-[auto_1fr]" : ""
              }`}
            >
              {showItemsPanel && (
                <div className="relative w-44">
                  <ForecastControls
                    onSettingsClick={() => setSettingsOpen(true)}
                  />
                  {context.isLoading && <LoadingIndicator className="ml-2" />}
                </div>
              )}
              <OutlierGrid />
            </div>
          </div>
        ) : (
          // ── No data: guided setup wizard ──
          <ForecastSetupWizard {...wizardProps} />
        )}
      </div>
    </div>
  );
};

export default Forecasting;
