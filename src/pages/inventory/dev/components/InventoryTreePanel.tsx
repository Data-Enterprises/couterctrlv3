// Hooks
import { useMemo, useState } from "react";

// Interfaces
import type { TreeGroup, ProductSummary } from "../interfaces";
import type { HelpPage } from "../../../../constants/helpPages";

// Components
import TextFilter from "../../../../components-dev/filters/TextFilter";
import TreePanelHeader from "./TreePanelHeader";
import GroupRow from "./GroupRow";
import ProductRow from "./ProductRow";

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
      <div className="cc-panel shadow-sm h-full">
        <TreePanelHeader
          title={title}
          helpPage={helpPage}
          storeName={storeName}
          dateLabel={dateLabel}
          onSearchOpen={onSearchOpen}
          onExportOpen={onExportOpen}
        />

        <div className="px-3 py-2 border-b border-line_hair flex-shrink-0">
          <TextFilter
            value={filter}
            onChange={setFilter}
            placeholder={filterPlaceholder}
          />
        </div>

        <div data-help="tree" className="cc-scroll">
          {visibleGroups.map((g) => {
            const isOpen = g.id === openGroup;
            return (
              <div key={g.id}>
                <GroupRow
                  group={g}
                  isOpen={isOpen}
                  onToggle={() => onToggleGroup(g.id)}
                />

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
                    {visibleProducts.map((p) => (
                      <ProductRow
                        key={p.productCode}
                        product={p}
                        isSelected={p.productCode === selectedUpc}
                        onSelect={() => onSelectProduct(p)}
                      />
                    ))}
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
