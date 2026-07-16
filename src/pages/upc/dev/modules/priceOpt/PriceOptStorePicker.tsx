import { useMemo } from "react";
import { useUpcDevCtx } from "../../hooks/useUpcDevCtx";
import { useAppDispatch } from "../../../../../hooks";
import { setDevPriceOptStoreId } from "../../../../../features/upcDevSlice";

// Group search only — resolved client-side from stores the user already has
// access to, filtered down to this search's storeids. No extra fetch.
const PriceOptStorePicker = () => {
  const ctx = useUpcDevCtx();
  const dispatch = useAppDispatch();

  const groupStores = useMemo(() => {
    const ids = new Set(ctx.storeids.split(",").filter(Boolean));
    return ctx.assignedStores.filter((s) => ids.has(String(s.storeid)));
  }, [ctx.storeids, ctx.assignedStores]);

  return (
    <div className="px-3 py-2 border-b border-gray-100 bg-amber-50/60 flex-shrink-0">
      <label className="block text-[10px] font-medium text-content mb-1">
        Store for price comparison
      </label>
      <select
        value={ctx.priceOptStoreId ?? ""}
        onChange={(e) => dispatch(setDevPriceOptStoreId(e.target.value ? Number(e.target.value) : null))}
        className="w-full text-[11px] px-2 py-1 rounded border border-content/20 bg-custom-white"
        style={{ outline: "none", boxShadow: "none" }}
      >
        <option value="">Choose store…</option>
        {groupStores.map((s) => (
          <option key={s.storeid} value={s.storeid}>{s.store_name}</option>
        ))}
      </select>
    </div>
  );
};

export default PriceOptStorePicker;
