import { useMemo } from "react";
import { useUpcDevCtx } from "../hooks/useUpcDevCtx";
import { useAppDispatch } from "../../../../hooks";
import {
  toggleDevSelectedUpc,
  setDevAllSelectedUpcs,
  resetDevSelectedUpcs,
  setDevFilterText,
} from "../../../../features/upcDevSlice";

const UpcItemList = () => {
  const ctx = useUpcDevCtx();
  const dispatch = useAppDispatch();

  const visible = useMemo(() => {
    let items = ctx.upcItems;
    if (ctx.showMode === "selected") {
      items = items.filter((i) => ctx.selectedUpcs.includes(i.product_code));
    }
    if (ctx.filterText) {
      const q = ctx.filterText.toLowerCase();
      items = items.filter(
        (i) =>
          i.product_code.includes(q) || i.description.toLowerCase().includes(q),
      );
    }
    return items;
  }, [ctx.upcItems, ctx.selectedUpcs, ctx.filterText, ctx.showMode]);

  const handleSelectAll = () => {
    const allCodes = visible.map((i) => i.product_code);
    dispatch(setDevAllSelectedUpcs(allCodes));
  };

  const handleDeselectAll = () => dispatch(resetDevSelectedUpcs());

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* toolbar */}
      <div className="flex-shrink-0 px-2 py-1.5 border-b border-gray-100 flex items-center gap-1.5">
        <input
          value={ctx.filterText}
          onChange={(e) => dispatch(setDevFilterText(e.target.value))}
          placeholder="Filter…"
          className="flex-1 text-[10px] rounded px-2 py-1 border border-gray-200 bg-gray-50 min-w-0"
          style={{
            outline: "none",
            WebkitAppearance: "none",
            boxShadow: "none",
          }}
        />
        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            className="text-[10px] text-[#1e2a4a] font-medium hover:underline"
          >
            All
          </button>
          <button
            onClick={handleDeselectAll}
            className="text-[10px] text-[#1e2a4a] hover:text-content/85"
          >
            None
          </button>
        </div>
      </div>

      {/* list */}
      <div className="flex-1 overflow-y-auto thin-scrollbar min-h-0">
        {visible.length === 0 ? (
          <div className="flex items-center justify-center h-16 text-[10px] text-content/85">
            {ctx.filterText ? "No matches" : "No items"}
          </div>
        ) : (
          visible.map((item) => {
            const selected = ctx.selectedUpcs.includes(item.product_code);
            return (
              <button
                key={item.product_code}
                onClick={() =>
                  dispatch(toggleDevSelectedUpc(item.product_code))
                }
                className={`w-full text-left flex items-center gap-2 px-3 py-[7px] border-b border-gray-100 hover:bg-gray-50/80 transition-colors ${
                  selected ? "bg-blue-50/60" : ""
                }`}
              >
                <div
                  className={`flex-shrink-0 w-3.5 h-3.5 rounded border transition-colors ${
                    selected
                      ? "bg-[#1e2a4a] border-[#1e2a4a]"
                      : "border-gray-300 bg-custom-white"
                  }`}
                >
                  {selected && (
                    <svg
                      viewBox="0 0 10 10"
                      className="w-full h-full text-custom-white"
                    >
                      <polyline
                        points="2,5 4,7.5 8,2.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {ctx.displayMode === "code" ? (
                    <>
                      <div className="text-[12px] font-medium text-content truncate">
                        {item.description}
                      </div>
                      <div className="text-[11px] text-content tabular-nums">
                        {item.product_code}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-[12px] font-medium text-content truncate">
                        {item.description}
                      </div>
                      <div className="text-[11px] text-content tabular-nums">
                        {item.product_code}
                      </div>
                    </>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default UpcItemList;
