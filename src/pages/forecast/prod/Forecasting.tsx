// Hooks
import { useState } from "react";
import { useForecastCtx, useForecastSearch } from "./hooks";

// Components
import SearchPopup from "../../../components/SearchPopup";
import ForecastEntry from "./entry/ForecastEntry";
import ForecastListPanel from "./listPanel/ForecastListPanel";
import ForecastRowsTable from "./rowsTable/ForecastRowsTable";
import ForecastCalcModal from "./calc/ForecastCalcModal";
import ForecastExportModal from "./export/ForecastExportModal";

/** The Forecasting page: a UPC and store search card, then the forecast list beside its rows table.
 *  Search runs in two batches against the dev slice, and the calc and export modals sit over the results. */
const Forecasting = () => {
  const ctx = useForecastCtx();
  const { rowData, isLoading, noResults } = ctx;
  const [exportOpen, setExportOpen] = useState<boolean>(false);
  // Once rows are on screen the search card becomes an overlay rather than
  // taking the page back — same as every other page that searches.
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const { handleSearch } = useForecastSearch(ctx, () => setSearchOpen(false));

  // Desktop only: no tablet layout, and no mobile version (Forecasting is not
  // on the mobile nav).
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
            <SearchPopup onClose={() => setSearchOpen(false)}>
              <ForecastEntry
                onSearch={handleSearch}
                isLoading={isLoading}
                onClose={() => setSearchOpen(false)}
              />
            </SearchPopup>
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

export default Forecasting;
