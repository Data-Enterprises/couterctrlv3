import { useState } from "react";
import { useAppSelector } from "../../hooks";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import SingleStoreSearchCard from "../../components/SingleStoreSearchCard";
import SingleDatePicker from "../../components/datePickers/SingleDatePicker";
import { useVendorSearch } from "./useVendorSearch";
import VendorListPanel from "./VendorListPanel";
import VendorDetailPanel from "./VendorDetailPanel";
import VendorsMobile from "./mobile/VendorsMobile";

/**
 * Vendors — Performance.
 *
 * One store, one week, graded against last week and the same week last year.
 * Structurally the sibling of Sub Dept Margins and Categories: single-store
 * search, a graded list on the left, detail on the right, a metric toggle and a
 * threshold the user sets.
 *
 * The fetch lives here rather than in a panel, per the page pattern — panels
 * render what the container loaded and never reach for data themselves.
 */
const Vendors = () => {
  const context = useAppSelector((s) => s.app);
  const search = useAppSelector((s) => s.search);
  const user = useAppSelector((s) => s.user);
  const vend = useAppSelector((s) => s.vendors);
  const { runSearch } = useVendorSearch();

  const [searchOpen, setSearchOpen] = useState(false);
  const [storeId, setStoreId] = useState(search.lastStore || 0);

  const entry = (
    <SingleStoreSearchCard
      title="Vendor Performance"
      description="Pick a store and a week. Vendors are graded against last week and the same week last year."
      buttonLabel="Load vendors"
      stores={user.assignedStores}
      selectedStoreId={storeId}
      onStoreSelect={setStoreId}
      onSearch={() => {
        setSearchOpen(false);
        runSearch(storeId);
      }}
      loading={vend.loading}
      loadingMessage={vend.loadingMessage}
      datePicker={<SingleDatePicker />}
    />
  );

  // Mobile gets its own screens; the desktop two-panel layout below never
  // renders on a phone. Placed after the hooks so hook order stays stable.
  if (context.isMobile) return <VendorsMobile />;

  if (vend.loading) {
    return (
      <div className="w-full select-none min-h-[calc(100vh-3rem)] relative">
        <LoadingIndicator
          message={vend.loadingMessage || "Loading vendors..."}
        />
      </div>
    );
  }

  if (vend.rows.length === 0) {
    return (
      <div className="w-full select-none min-h-[calc(100vh-3rem)] flex items-center justify-center p-4">
        {entry}
      </div>
    );
  }

  return (
    <div className="w-full p-4 select-none min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden">
      {/* Re-search is an overlay, never a return to the entry screen — losing
          the loaded week to change one field is the thing that pattern exists
          to prevent. */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSearchOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>{entry}</div>
        </div>
      )}

      <div className="flex gap-4 h-[calc(100vh-5rem)]">
        <VendorListPanel onSearchOpen={() => setSearchOpen(true)} />
        <VendorDetailPanel />
      </div>
    </div>
  );
};

export default Vendors;
