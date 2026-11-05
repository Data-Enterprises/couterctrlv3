// Hooks
import { useAppDispatch, useAppSelector } from "../../../../../../hooks";

// Redux
import { setPerfStoreSort } from "../../../../../../features/dev/devSalesPerfSlice";

// Utils
import { cmpShort, dirOf } from "../utils/perfData";

// Interfaces
import type { CmpBasis, PairSort } from "../utils/perfData";
import type { SortOption } from "../../../../../../components-dev/mobile/MobileSortChips";

// Components
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/20/solid";
import MobileSortChips from "../../../../../../components-dev/mobile/MobileSortChips";

interface StoreListControlsProps {
  /** What the group card compares against, for the change chip's label. */
  groupBasis: CmpBasis;
  storeFilter: string;
  setStoreFilter: (v: string) => void;
}

const storeSorts = (basis: CmpBasis): SortOption<PairSort>[] => [
  { key: "sales", label: "Sales" },
  { key: "change", label: `Change vs ${cmpShort(basis)}` },
  { key: "name", label: "Store #" },
];

/** How the store list is ordered and narrowed: sort chips and a filter box. */
const StoreListControls = ({
  groupBasis,
  storeFilter,
  setStoreFilter,
}: StoreListControlsProps) => {
  const dispatch = useAppDispatch();
  const perf = useAppSelector((s) => s.dev.salesPerf);
  return (
  <section className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white shadow-md">
    <MobileSortChips
      options={storeSorts(groupBasis)}
      value={perf.storeSort?.key ?? null}
      dir={
        perf.storeSort
          ? dirOf(perf.storeSort.key, perf.storeSort.reversed)
          : null
      }
      onChange={(key) => dispatch(setPerfStoreSort(key))}
    />
    <div className="px-3.5 py-2">
      <div className="flex items-center gap-2 rounded-lg bg-bkg px-3">
        <MagnifyingGlassIcon className="h-4 w-4 flex-none text-content/95" />
        <input
          id="perf-store-filter"
          value={storeFilter}
          onChange={(e) => setStoreFilter(e.target.value)}
          placeholder="Filter by store"
          inputMode="search"
          enterKeyHint="search"
          aria-label="Filter by store"
          className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-[14px] text-content placeholder:text-content/85"
          style={{
            outline: "none",
            WebkitAppearance: "none",
            boxShadow: "none",
          }}
        />
        {storeFilter && (
          <button
            type="button"
            onClick={() => setStoreFilter("")}
            aria-label="Clear filter"
            className="-mr-1 flex h-7 w-7 flex-none items-center justify-center rounded-full text-content/95 active:bg-custom-white"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  </section>
  );
};

export default StoreListControls;
