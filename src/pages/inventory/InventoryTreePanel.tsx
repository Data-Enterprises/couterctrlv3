import { useMemo, useState } from "react";
import {
  ChevronRightIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/20/solid";
import { formatCurrencyCompact } from "../../utils";
import TextFilter from "../../components/filters/TextFilter";
import HeaderIconButton from "../../components/HeaderIconButton";
import type { ProductSummary } from "./inventoryData";

/**
 * Groups, and the items inside the one that's open.
 *
 * A tree rather than two screens because the comparison that matters is
 * between sibling items — you open a group to find out which of its items is
 * priced oddly, and pushing that behind a drill-in would cost a click each way
 * to answer it.
 *
 * Only one group is expanded at a time. On the department page each expansion
 * is a network call, so leaving several open would invite exactly the fan-out
 * that page is designed to avoid; on the vendor page it costs nothing, but two
 * groups' items side by side answer no question either way, since pricing
 * patterns are read within a supplier or a category.
 *
 * Group ids are strings so one component serves both — department numbers and
 * vendor ids have nothing else in common, and a second copy of this file would
 * have drifted the first time either page changed.
 */

export interface TreeGroup {
  id: string;
  label: string;
  sales: number;
  /** Null when the count can't be known until the group is opened, which is
   *  the department page's situation — `sub_sales` aggregates above the item
   *  line. Rendered as nothing rather than a misleading zero. */
  itemCount: number | null;
}

interface Props {
  title: string;
  storeName: string;
  dateLabel: string;
  filterPlaceholder: string;
  groups: TreeGroup[];
  openGroup: string | null;
  products: ProductSummary[];
  productsLoading: boolean;
  selectedUpc: string | null;
  onToggleGroup: (id: string) => void;
  onSelectProduct: (p: ProductSummary) => void;
  onSearchOpen: () => void;
  onExportOpen: () => void;
}

const InventoryTreePanel = ({
  title,
  storeName,
  dateLabel,
  filterPlaceholder,
  groups,
  openGroup,
  products,
  productsLoading,
  selectedUpc,
  onToggleGroup,
  onSelectProduct,
  onSearchOpen,
  onExportOpen,
}: Props) => {
  const [filter, setFilter] = useState("");

  // The filter reaches items as well as groups, so typing a product name
  // narrows the open group rather than emptying the tree.
  const term = filter.trim().toLowerCase();
  const visibleGroups = useMemo(
    () =>
      term
        ? groups.filter(
            (g) => g.label.toLowerCase().includes(term) || g.id === openGroup,
          )
        : groups,
    [groups, term, openGroup],
  );
  const visibleProducts = useMemo(
    () =>
      term
        ? products.filter(
            (p) =>
              p.description.toLowerCase().includes(term) ||
              p.productCode.includes(term),
          )
        : products,
    [products, term],
  );

  return (
    /* 26% matches Receivers, the widest of the data-page panels and the closest
       relative — both are nested lists rather than flat ones, and the second
       level here carries full product descriptions. */
    <div className="flex-shrink-0 shadow-lg" style={{ width: "26%" }}>
      <div className="bg-custom-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
        <div className="flex-shrink-0 px-4 py-[10px] flex items-center justify-between gap-3 bg-[#1e2a4a]">
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-custom-white leading-tight truncate">
              {title}
            </div>
            <div className="text-[10px] mt-0.5 text-custom-white truncate">
              {storeName} · {dateLabel}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <HeaderIconButton onClick={onExportOpen} title="Export CSV">
              <ArrowDownTrayIcon className="h-3 w-3" />
            </HeaderIconButton>
            <HeaderIconButton onClick={onSearchOpen} title="New search">
              <MagnifyingGlassIcon className="h-3 w-3" />
            </HeaderIconButton>
          </div>
        </div>

        <div className="px-3 py-2 border-b border-gray-100 flex-shrink-0">
          <TextFilter
            value={filter}
            onChange={setFilter}
            placeholder={filterPlaceholder}
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
          {visibleGroups.map((g) => {
            const isOpen = g.id === openGroup;
            return (
              <div key={g.id}>
                <button
                  onClick={() => onToggleGroup(g.id)}
                  className={`w-full flex items-center gap-1.5 px-3 py-2 text-left transition-colors ${
                    isOpen ? "bg-gray-50" : "hover:bg-gray-50"
                  }`}
                >
                  {isOpen ? (
                    <ChevronDownIcon className="w-3.5 h-3.5 text-content/40 flex-shrink-0" />
                  ) : (
                    <ChevronRightIcon className="w-3.5 h-3.5 text-content/40 flex-shrink-0" />
                  )}
                  <span
                    className={`flex-1 min-w-0 truncate text-[12px] ${isOpen ? "font-semibold text-content" : "text-content"}`}
                  >
                    {g.label}
                  </span>
                  {g.itemCount !== null && (
                    <span className="text-[10px] text-content/50 tabular-nums flex-shrink-0">
                      {g.itemCount}
                    </span>
                  )}
                  <span className="text-[10px] text-content/60 tabular-nums flex-shrink-0">
                    {formatCurrencyCompact(g.sales)}
                  </span>
                </button>

                {isOpen && (
                  <div className="pb-1">
                    {productsLoading && (
                      <div className="pl-8 pr-3 py-2 text-[11px] text-content/60">
                        Loading items…
                      </div>
                    )}
                    {!productsLoading && visibleProducts.length === 0 && (
                      <div className="pl-8 pr-3 py-2 text-[11px] text-content/60">
                        No items matched
                      </div>
                    )}
                    {visibleProducts.map((p) => {
                      const isSel = p.productCode === selectedUpc;
                      return (
                        <button
                          key={p.productCode}
                          onClick={() => onSelectProduct(p)}
                          className={`w-full flex items-center gap-2 pl-8 pr-3 py-1.5 text-left border-l-2 transition-colors ${
                            isSel
                              ? "border-blue-600 bg-blue-50"
                              : "border-transparent hover:bg-gray-50"
                          }`}
                        >
                          <span
                            className={`flex-1 min-w-0 truncate text-[11.5px] ${
                              isSel
                                ? "text-blue-900 font-medium"
                                : "text-content"
                            }`}
                          >
                            {p.description}
                          </span>
                          <span
                            className={`text-[10px] tabular-nums flex-shrink-0 ${
                              isSel ? "text-blue-900" : "text-content/60"
                            }`}
                          >
                            {formatCurrencyCompact(p.sales)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default InventoryTreePanel;
