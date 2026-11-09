// Hooks
import { useAdminPageCtx } from "../../hooks";

/** The Store Activity rows: store number, name, total days, active days and missing days, with missing days
 *  in red when there are any. */
const StoreRows = () => {
  const { filteredStoresActivity } = useAdminPageCtx();
  return (
    <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar divide-y divide-brand_navy/15">
      {filteredStoresActivity.map((s) => (
        <div
          key={s.storeid}
          className="grid grid-cols-[0.6fr_2fr_1fr_1fr_1fr] px-4 py-2 text-[12px] text-content even:bg-row_stripe hover:bg-gray-50"
        >
          <div>{s.storeid}</div>
          <div className="truncate">{s.store_name}</div>
          <div className="text-right">{s.total_days_in_range}</div>
          <div className="text-right">{s.active_days}</div>
          <div
            className={`text-right ${s.inactive_or_missing_days > 0 ? "text-red-600 font-medium" : "text-content"}`}
          >
            {s.inactive_or_missing_days}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StoreRows;
