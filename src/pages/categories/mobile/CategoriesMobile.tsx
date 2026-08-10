import { useEffect, useState } from "react";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import { useAppSelector } from "../../../hooks";
import SingleStoreSearchCard from "../../../components/SingleStoreSearchCard";
import SingleDatePicker from "../../../components/datePickers/SingleDatePicker";
import CategoryListMobile from "./CategoryListMobile";
import CategoryReportMobile from "./CategoryReportMobile";

/**
 * Categories on mobile — entry card, graded list, one category's week.
 *
 * Screen routing and the body-scroll lock only. The fetches come in as props
 * from `Categories.tsx`, which calls `useCategoryData` exactly once: that hook
 * installs the item-loading effect, so calling it here too would fire every
 * item fetch twice.
 *
 * `selectedCategory` in the slice doubles as "am I on the report screen".
 */

interface Props {
  runSearch: (storeId: number) => Promise<number>;
  onLoadHourly: () => void;
}

const CategoriesMobile = ({ runSearch, onLoadHourly }: Props) => {
  const user = useAppSelector((s) => s.user);
  const search = useAppSelector((s) => s.search);
  const cats = useAppSelector((s) => s.categories);

  const [storeId, setStoreId] = useState(search.lastStore || 0);
  // Re-search opens the entry card rather than refetching on the spot — the
  // point is to pick a different store or week. Results stay in the store so
  // "Back to results" returns without a fetch.
  const [showSearch, setShowSearch] = useState(false);
  const [notice, setNotice] = useState<string | undefined>(undefined);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const hasData = cats.rows.length > 0;

  // `selectedCategory` can legitimately be 0 — an explicit null check, not a
  // truthiness test, or category 0 would never open.
  if (cats.selectedCategory !== null && !showSearch) {
    return <CategoryReportMobile onLoadHourly={onLoadHourly} />;
  }

  if (hasData && !showSearch) {
    return <CategoryListMobile onSearch={() => setShowSearch(true)} />;
  }

  return (
    <div className="h-[calc(100dvh-3rem)] overflow-y-auto">
      <div className="mx-4 pt-4 pb-2">
        <SingleStoreSearchCard
          title="Category Performance"
          description="Pick a store and a week. Categories are graded against last week and the same week last year."
          buttonLabel="Load categories"
          stores={user.assignedStores}
          selectedStoreId={storeId}
          onStoreSelect={setStoreId}
          onSearch={async () => {
            setNotice(undefined);
            const count = await runSearch(storeId);
            if (count > 0) setShowSearch(false);
            else
              setNotice("No category sales came back for that store and week.");
          }}
          loading={cats.loading}
          loadingMessage={cats.loadingMessage || "Loading categories..."}
          datePicker={<SingleDatePicker />}
          notice={notice}
        >
          {hasData && (
            <button
              onClick={() => setShowSearch(false)}
              className="w-full py-2.5 flex items-center justify-center gap-1.5 transition-colors"
              style={{ background: "rgba(30,42,74,0.07)", borderRadius: 10 }}
            >
              <ArrowLeftIcon className="w-4 h-4 text-[#1e2a4a]" />
              <span className="text-[#1e2a4a] font-semibold text-[13px] underline underline-offset-2">
                Back to results
              </span>
            </button>
          )}
        </SingleStoreSearchCard>
      </div>
    </div>
  );
};

export default CategoriesMobile;
