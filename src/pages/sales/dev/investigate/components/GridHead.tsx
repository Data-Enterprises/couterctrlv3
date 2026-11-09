// Utils
import { CAUSE_LABEL } from "../utils/deptInvestigation";
import { CAUSE_ORDER } from "../utils";
import { COLUMNS, label, ruleOf, tintOf } from "../utils/columns";

// Interfaces
import type { Cause, CauseTotal, Col, FilterKind } from "../interfaces";
import type { InvestigationTarget } from "../../../../../features/dev/devSalesLedgerSlice";
import type { SortState } from "../../../../../utils/useTriStateSort";
import type { useItemFilters } from "../hooks";

// Components
import SortHeader from "../../../../../components-dev/SortHeader";
import ColFilter from "../../../../../components-dev/filters/ColFilterPopover";
import { colInputStyle } from "../../../../../components-dev/filters/colFilterStyles";

/** The grid's heading row: a filter, a sort or a plain label per column. */
const GridHead = ({
  target,
  filters,
  byCause,
  sort,
  onSort,
}: {
  target: InvestigationTarget;
  filters: ReturnType<typeof useItemFilters>;
  byCause: Map<Cause, CauseTotal>;
  sort: SortState<Col>;
  onSort: (col: Col) => void;
}) => {
  const {
    only,
    setOnly,
    itemDraft,
    setItemDraft,
    upcDraft,
    setUpcDraft,
    vendorQ,
    setVendorQ,
    vendors,
    filterActive,
    applyFilter,
    clearFilter,
  } = filters;

  return (
    <thead>
      <tr>
        <th className="sticky top-0 left-0 z-30 w-[44px] bg-bkg border-b border-brand_line_2 border-r border-brand_line px-2 py-1.5"></th>
        {COLUMNS.map((c) => (
          <th
            key={c.key}
            style={{ minWidth: c.width }}
            className={`sticky top-0 z-10 border-b border-brand_line_2 border-r border-brand_line px-2.5 py-1.5 text-left font-semibold whitespace-nowrap ${ruleOf(c)} ${tintOf(c) || "bg-custom-white"}`}
          >
            {c.filter ? (
              <ColFilter
                label={label(c, target)}
                labelSize="text-[11px]"
                active={filterActive(c.filter)}
                onApply={() =>
                  applyFilter(c.filter as FilterKind)
                }
                onClear={() =>
                  clearFilter(c.filter as FilterKind)
                }
              >
                {c.filter === "item" && (
                  <input
                    autoFocus
                    style={colInputStyle}
                    placeholder="Search item…"
                    value={itemDraft}
                    onChange={(e) =>
                      setItemDraft(e.target.value)
                    }
                  />
                )}
                {c.filter === "upc" && (
                  <input
                    autoFocus
                    style={colInputStyle}
                    placeholder="Search UPC…"
                    value={upcDraft}
                    onChange={(e) =>
                      setUpcDraft(e.target.value)
                    }
                  />
                )}
                {/* Vendor and cause are both closed sets, so they
              are picked rather than typed — a vendor name is
              not something anyone spells from memory. They
              apply on change, since there is nothing to
              finish typing. */}
                {c.filter === "vendor" && (
                  <select
                    style={colInputStyle}
                    value={vendorQ}
                    onChange={(e) => setVendorQ(e.target.value)}
                  >
                    <option value="">Every vendor</option>
                    {vendors.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                )}
                {c.filter === "cause" && (
                  <select
                    style={colInputStyle}
                    value={only ?? ""}
                    onChange={(e) =>
                      setOnly(
                        (e.target.value ||
                          null) as Cause | null,
                      )
                    }
                  >
                    <option value="">Every cause</option>
                    {CAUSE_ORDER.filter((x) =>
                      byCause.has(x),
                    ).map((x) => (
                      <option key={x} value={x}>
                        {CAUSE_LABEL[x]}
                      </option>
                    ))}
                  </select>
                )}
              </ColFilter>
            ) : c.sort ? (
              <SortHeader
                col={c.sort}
                label={label(c, target)}
                sort={sort}
                onSort={onSort}
                className="text-[11px] font-semibold uppercase tracking-wide text-content/95 hover:text-content"
              />
            ) : (
              <span className="uppercase tracking-wide text-content/95">
                {label(c, target)}
              </span>
            )}
          </th>
        ))}
      </tr>
    </thead>
  );
};

export default GridHead;
