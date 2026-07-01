import { useAppDispatch } from "../../../../hooks";
import { useSubMarginActions } from "../../hooks/useSubMarginActions";
import { useSubMarginState } from "../../hooks/useSubMarginState";
import type { ItemFilterType } from "../../../../features/subMarginSlice";
import { ArrowPathIcon } from "@heroicons/react/16/solid";
import { formatCurrency2, formatBigNumber } from "../../../../utils";

const FILTER_TYPES: { type: ItemFilterType; label: string }[] = [
  { type: "upc", label: "UPC" },
  { type: "description", label: "Description" },
  { type: "sales", label: "Sales" },
  { type: "qty", label: "Qty" },
  { type: "cogs", label: "COGS" },
  { type: "margin", label: "Margin" },
];

const SmDevItemFilterBar = () => {
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();
  const sm = useSubMarginState();

  const activeLabel = (type: ItemFilterType): string => {
    if (type === "upc") return sm.upcFilter ? `UPC: ${sm.upcFilter}` : "UPC";
    if (type === "description")
      return sm.descFilter ? `Desc: ${sm.descFilter}` : "Description";
    if (type === "sales")
      return sm.salesFilter.value
        ? `Sales ${sm.salesFilter.operator} ${formatCurrency2(sm.salesFilter.value)}`
        : "Sales";
    if (type === "qty")
      return sm.qtyFilter.value
        ? `Qty ${sm.qtyFilter.operator} ${formatBigNumber(sm.qtyFilter.value, 0)}`
        : "Qty";
    if (type === "cogs")
      return sm.cogsFilter.value
        ? `COGS ${sm.cogsFilter.operator} ${formatCurrency2(sm.cogsFilter.value)}`
        : "COGS";
    if (type === "margin")
      return sm.marginFilter.value
        ? `Margin ${sm.marginFilter.operator} ${formatBigNumber(sm.marginFilter.value, 2)}%`
        : "Margin";
    return type;
  };

  const isActive = (type: ItemFilterType) => {
    if (type === "upc") return !!sm.upcFilter;
    if (type === "description") return !!sm.descFilter;
    if (type === "sales") return !!sm.salesFilter.operator;
    if (type === "qty") return !!sm.qtyFilter.operator;
    if (type === "cogs") return !!sm.cogsFilter.operator;
    if (type === "margin") return !!sm.marginFilter.operator;
    return false;
  };

  const hasAnyFilter = FILTER_TYPES.some(({ type }) => isActive(type));

  const handleFilter = (type: ItemFilterType) => {
    dispatch(actions.setItemFilterType(type));
    dispatch(actions.setFilterModalOpen(true));
  };

  return (
    <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-100 bg-gray-50/50 flex-shrink-0 flex-wrap">
      <span className="text-[9px] text-content/40 uppercase tracking-wide font-medium mr-0.5">
        Filter
      </span>
      {FILTER_TYPES.map(({ type }) => {
        const active = isActive(type);
        return (
          <button
            key={type}
            className={`text-[11px] font-medium px-2.5 py-0.5 rounded transition-colors ${
              active
                ? "bg-amber-100 text-amber-800 border border-amber-200"
                : "bg-gray-100 text-content/60 hover:bg-gray-200 border border-transparent"
            }`}
            onClick={() => handleFilter(type)}
          >
            {activeLabel(type)}
          </button>
        );
      })}
      {hasAnyFilter && (
        <button
          className="text-content/40 hover:text-content/70 transition-colors ml-auto"
          onClick={() => dispatch(actions.resetFilters())}
          title="Reset filters"
        >
          <ArrowPathIcon className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
};

export default SmDevItemFilterBar;
