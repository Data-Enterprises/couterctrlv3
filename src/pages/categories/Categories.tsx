import { useState } from "react";
import { useAppSelector } from "../../hooks";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import SingleStoreSearchCard from "../../components/SingleStoreSearchCard";
import SingleDatePicker from "../../components/datePickers/SingleDatePicker";
import { useCategoryData } from "./useCategoryData";
import CategoryListPanel from "./CategoryListPanel";
import CategoryDetailPanel from "./CategoryDetailPanel";
import CategoriesMobile from "./mobile/CategoriesMobile";

/**
 * Categories — Performance.
 *
 * One store, one week, graded against last week and the same week last year.
 * Structurally the sibling of Sub Dept Margins: single-store search, a graded
 * list on the left, detail on the right, a metric toggle and a threshold the
 * user sets.
 *
 * The fetch lives here rather than in a panel, per the page pattern — panels
 * render what the container loaded and never reach for data themselves.
 */
const Categories = () => {
  const context = useAppSelector((s) => s.app);
  const search = useAppSelector((s) => s.search);
  const user = useAppSelector((s) => s.user);
  const cats = useAppSelector((s) => s.categories);
  // Called exactly once per mounted page — it installs the item-loading
  // effect, and the mobile layout receives these as props rather than
  // calling the hook again.
  const { runSearch, loadHourly } = useCategoryData();

  const [searchOpen, setSearchOpen] = useState(false);
  const [storeId, setStoreId] = useState(search.lastStore || 0);

  if (context.isMobile)
    return <CategoriesMobile runSearch={runSearch} onLoadHourly={loadHourly} />;

  const entry = (
    <SingleStoreSearchCard
      title="Category Performance"
      description="Pick a store and a week. Categories are graded against last week and the same week last year."
      buttonLabel="Load categories"
      stores={user.assignedStores}
      selectedStoreId={storeId}
      onStoreSelect={setStoreId}
      onSearch={() => {
        setSearchOpen(false);
        runSearch(storeId);
      }}
      loading={cats.loading}
      loadingMessage={cats.loadingMessage}
      datePicker={<SingleDatePicker />}
    />
  );

  if (cats.loading) {
    return (
      <div className="w-full select-none min-h-[calc(100vh-3rem)] relative">
        <LoadingIndicator
          message={cats.loadingMessage || "Loading categories..."}
        />
      </div>
    );
  }

  if (cats.rows.length === 0) {
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
        <CategoryListPanel onSearchOpen={() => setSearchOpen(true)} />
        <CategoryDetailPanel onLoadHourly={loadHourly} />
      </div>
    </div>
  );
};

export default Categories;
