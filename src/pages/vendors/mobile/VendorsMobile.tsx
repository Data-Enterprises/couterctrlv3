import { useEffect, useState } from "react";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import { useAppSelector } from "../../../hooks";
import SingleStoreSearchCard from "../../../components/SingleStoreSearchCard";
import SingleDatePicker from "../../../components/datePickers/SingleDatePicker";
import { useVendorSearch } from "../useVendorSearch";
import VendorListMobile from "./VendorListMobile";
import VendorItemsSheet from "./VendorItemsSheet";

/**
 * Vendors on mobile — entry card, graded list, one vendor's week.
 *
 * Owns only screen routing and the body-scroll lock; the search itself is
 * `useVendorSearch`, shared with the desktop container so the two can't drift.
 *
 * Picking a vendor opens a BottomSheet over the list rather than pushing a
 * screen — the vendor list IS the screen it was picked from, so a separate
 * report view would just be the sheet's contents with an extra back button.
 * Same treatment Sales gives a sub department.
 */
const VendorsMobile = () => {
  const user = useAppSelector((s) => s.user);
  const search = useAppSelector((s) => s.search);
  const vend = useAppSelector((s) => s.vendors);
  const { runSearch } = useVendorSearch();

  const [storeId, setStoreId] = useState(search.lastStore || 0);
  // Re-search opens the entry card rather than refetching on the spot — the
  // point is to pick a different store or week. Results stay in the store so
  // "Back to results" returns without a fetch, matching Sub Dept Margins.
  const [showSearch, setShowSearch] = useState(false);
  const [notice, setNotice] = useState<string | undefined>(undefined);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const hasData = vend.rows.length > 0;

  if (hasData && !showSearch) {
    return (
      <>
        <VendorListMobile onSearch={() => setShowSearch(true)} />
        {vend.selectedVendor && <VendorItemsSheet />}
      </>
    );
  }

  return (
    <div className="h-[calc(100dvh-3rem)] overflow-y-auto">
      <div className="mx-4 pt-4 pb-2">
        <SingleStoreSearchCard
          title="Vendor Performance"
          description="Pick a store and a week. Vendors are graded against last week and the same week last year."
          buttonLabel="Load vendors"
          stores={user.assignedStores}
          selectedStoreId={storeId}
          onStoreSelect={setStoreId}
          onSearch={async () => {
            setNotice(undefined);
            const count = await runSearch(storeId);
            if (count > 0) setShowSearch(false);
            else
              setNotice("No vendor sales came back for that store and week.");
          }}
          loading={vend.loading}
          loadingMessage={vend.loadingMessage || "Finding vendors..."}
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

export default VendorsMobile;
