import { useMemo } from "react";
import { useUpcDevCtx } from "../../hooks/useUpcDevCtx";
import { useAppDispatch } from "../../../../../hooks";
import { setDevPriceOptStoreId } from "../../../../../features/upcDevSlice";
import SelectFilter from "../../../../../components/filters/SelectFilter";

// Group search only — resolved client-side from stores the user already has
// access to, filtered down to this search's storeids. No extra fetch. Lives
// in the detail panel (not the left panel) since which store you're
// checking is a per-report concern, not a page-level filter — still one
// shared choice though, not per item, so switching items keeps the same
// store selected.
const PriceOptStorePicker = () => {
  const ctx = useUpcDevCtx();
  const dispatch = useAppDispatch();

  const options = useMemo(() => {
    const ids = new Set(ctx.storeids.split(",").filter(Boolean));
    return ctx.assignedStores
      .filter((s) => ids.has(String(s.storeid)))
      .map((s) => ({ label: s.store_name, value: String(s.storeid) }));
  }, [ctx.storeids, ctx.assignedStores]);

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
      <span className="text-[11px] text-content/85 flex-shrink-0">Checking pricing at</span>
      <SelectFilter
        options={options}
        value={ctx.priceOptStoreId !== null ? String(ctx.priceOptStoreId) : ""}
        onChange={(v) => dispatch(setDevPriceOptStoreId(v ? Number(v) : null))}
        placeholder="Select a store"
        className="w-[220px]"
      />
    </div>
  );
};

export default PriceOptStorePicker;
