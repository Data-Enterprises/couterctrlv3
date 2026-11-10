// Hooks
import { useMemo, useState } from "react";

// Utils
import { treeMoney } from "../utils";

// Interfaces
import type { TreeGroup, ProductSummary } from "../interfaces";
import type { HelpPage } from "../../../../constants/helpPages";

// Components
import BackButton from "../../../../components-dev/BackButton";
import {
  ChevronRightIcon,
  ChevronDownIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/20/solid";
import PageInfoButton from "../../../../components-dev/PageInfoButton";
import TextFilter from "../../../../components-dev/filters/TextFilter";
import HeaderIconButton from "../../../../components-dev/HeaderIconButton";

interface InventoryTreePanelProps {
  title: string;
  /** Which of the two Price Opt help pages the "?" opens. */
  helpPage: HelpPage;
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
  /** Whether a group holds an item matching the filter, for a page with every
   *  item in hand (Vendor). The department page can't, and passes nothing. */
  groupHasItem?: (groupId: string, term: string) => boolean;
}

/**
 * Groups, and the items inside the one that's open: a tree, so sibling items
 * are compared side by side. One group open at a time (on the department page
 * each opening is a call). Group ids are strings so one component serves
 * departments and vendors.
 */
const InventoryTreePanel = ({
  title,
  helpPage,
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
  groupHasItem,
}: InventoryTreePanelProps) => {
  const [filter, setFilter] = useState("");

  // The filter reaches items as well as groups, so typing a product name
  // narrows the open group rather than emptying the tree.
  const term = filter.trim().toLowerCase();
  const visibleGroups = useMemo(
    () =>
      term
        ? groups.filter(
            (g) =>
              g.label.toLowerCase().includes(term) ||
              g.id === openGroup ||
              (groupHasItem?.(g.id, term) ?? false),
          )
        : groups,
    [groups, term, openGroup, groupHasItem],
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
    /* 26%, as on Receivers: both are nested lists with full descriptions on
       the second level. */
    <div className="flex-shrink-0 shadow-lg" style={{ width: "26%" }}>
      <div className="bg-custom-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
        <div className="flex-shrink-0 px-4 py-[10px] flex items-center justify-between gap-3 bg-brand_navy">
          <div className="min-w-0">
            <div className="text-[14px] font-semibold text-custom-white leading-tight truncate">
              {title}
            </div>
            <div className="text-[11px] mt-0.5 text-custom-white truncate">
              {storeName} · {dateLabel}
            </div>
          </div>
          <div data-help="scope" className="flex items-center gap-1.5 flex-shrink-0">
            <PageInfoButton page={helpPage} />
            <HeaderIconButton onClick={onExportOpen} title="Export CSV">
              <ArrowDownTrayIcon className="h-3 w-3" />
            </HeaderIconButton>
            <BackButton onClick={onSearchOpen} />
          </div>
        </div>

        <div className="px-3 py-2 border-b border-gray-100 flex-shrink-0">
          <TextFilter
            value={filter}
            onChange={setFilter}
            placeholder={filterPlaceholder}
          />
        </div>

        <div data-help="tree" className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
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
                    <ChevronDownIcon className="w-3.5 h-3.5 text-content/95 flex-shrink-0" />
                  ) : (
                    <ChevronRightIcon className="w-3.5 h-3.5 text-content/95 flex-shrink-0" />
                  )}
                  <span
                    className={`flex-1 min-w-0 truncate text-[13px] ${isOpen ? "font-semibold text-content" : "text-content"}`}
                  >
                    {g.label}
                  </span>
                  {g.itemCount !== null && (
                    <span className="text-[11px] text-content/95 tabular-nums flex-shrink-0">
                      {g.itemCount}
                    </span>
                  )}
                  <span className="text-[11px] text-content/95 tabular-nums flex-shrink-0">
                    {treeMoney(g.sales)}
                  </span>
                </button>

                {isOpen && (
                  <div className="pb-1">
                    {productsLoading && (
                      <div className="pl-8 pr-3 py-2 text-[12px] text-content/95">
                        Loading items…
                      </div>
                    )}
                    {!productsLoading && visibleProducts.length === 0 && (
                      <div className="pl-8 pr-3 py-2 text-[12px] text-content/95">
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
                            className={`flex-1 min-w-0 truncate text-[12.5px] ${
                              isSel
                                ? "text-blue-900 font-medium"
                                : "text-content"
                            }`}
                          >
                            {p.description}
                          </span>
                          <span
                            className={`text-[11px] tabular-nums flex-shrink-0 ${
                              isSel ? "text-blue-900" : "text-content/95"
                            }`}
                          >
                            {treeMoney(p.sales)}
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
