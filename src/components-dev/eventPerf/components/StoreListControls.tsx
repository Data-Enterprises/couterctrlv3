// Hooks
import { useAppDispatch } from "../../../hooks";
import { useEventPerfCtx } from "../hooks";

// Redux
import { setEventSort } from "../../../features/dev/devEventPerfSlice";

// Utils
import { eventDirOf } from "../utils";
import { sortOptions } from "../utils/display";

// Components
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/20/solid";
import MobileSortChips from "../../mobile/MobileSortChips";

interface StoreListControlsProps {
  measure: "transactions" | "amount";
  storeFilter: string;
  setStoreFilter: (v: string) => void;
}

/** How the store list is ordered and narrowed. */
const StoreListControls = ({ measure, storeFilter, setStoreFilter }: StoreListControlsProps) => {
  const dispatch = useAppDispatch();
  const { perf } = useEventPerfCtx();
  return (
    <section className="overflow-hidden rounded-2xl border border-line_field bg-custom-white shadow-md">
      <MobileSortChips
        options={sortOptions(measure, "store")}
        value={perf.sort.stores?.key ?? null}
        dir={
          perf.sort.stores
            ? eventDirOf(perf.sort.stores.key, perf.sort.stores.reversed)
            : null
        }
        onChange={(key) =>
          dispatch(setEventSort({ list: "stores", sort: key }))
        }
      />
      <div className="px-3.5 py-2">
        <div className="flex items-center gap-2 rounded-lg bg-bkg px-3">
          <MagnifyingGlassIcon className="h-4 w-4 flex-none text-content/95" />
          <input
            id="event-store-filter"
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
