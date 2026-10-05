import { useMemo } from "react";
import { ArrowPathIcon, MagnifyingGlassIcon } from "@heroicons/react/16/solid";
import MultiSelectFilter from "../../../../components-dev/filters/MultiSelectFilter";
import LoadingIndicator from "../../../../components-dev/loading/LoadingIndicator";
import type { AllOrder } from "../../../../interfaces";
import type { OrdersFilters } from "../../../../features/dev/devOrdersSlice";

interface Props {
  /** Every line item in the search, before any filter. */
  lines: AllOrder[];
  filters: OrdersFilters;
  onChange: (key: keyof OrdersFilters, values: (string | number)[]) => void;
  onClear: () => void;
  loading: boolean;
  /** How many lines survive the current configuration. */
  matched: number;
  startDate: string;
  endDate: string;
  onOpenSearch: () => void;
  scopeLabel: string;
}

/** Same three-digit pad the report panel uses on store numbers. */
const padStoreNumber = (n: string | number) => String(n).padStart(3, "0");

const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split("T")[0].split("-");
  return `${+m}/${+d}/${y}`;
};

/**
 * The left panel, as a configuration rather than a list of orders.
 *
 * The page used to fetch the available orders, draw them as cards, and load
 * one order's lines when you picked a card — so everything downstream was
 * scoped to a single store, date and order type, and there was no way to ask
 * for one department across every order.
 *
 * Now the search loads every line item once and this panel narrows it. Six
 * independent multi-selects, each built from the lines that actually came
 * back, so nothing offered here returns nothing. Empty means all.
 *
 * Order of the controls is the order people reach for them: what kind of
 * order, then whose, then when, then what is in it.
 */
const OrdersConfigPanel = ({
  lines,
  filters,
  onChange,
  onClear,
  loading,
  matched,
  startDate,
  endDate,
  onOpenSearch,
  scopeLabel,
}: Props) => {
  /**
   * The options, read off the result.
   *
   * Built in one pass rather than six: these lists run to thousands of rows
   * and walking them once per control was the obvious thing and the slow one.
   */
  const options = useMemo(() => {
    const types = new Set<string>();
    const stores = new Map<string, string>();
    const dates = new Set<string>();
    const subs = new Map<number, string>();
    const items = new Map<string, string>();
    const orderIds = new Set<number>();

    for (const o of lines) {
      if (o.order_type) types.add(o.order_type);
      if (o.storenumber) stores.set(o.storenumber, o.storename ?? o.storenumber);
      if (o.order_date) dates.add(o.order_date);
      if (o.sub_department != null)
        subs.set(o.sub_department, o.sub_department_description ?? "No department");
      if (o.product_code) items.set(String(o.product_code), o.description ?? "");
      if (o.order_id != null) orderIds.add(o.order_id);
    }

    return {
      types: [...types].sort().map((v) => ({ value: v, label: v })),
      stores: [...stores.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([num, name]) => ({
          value: num,
          label: `${padStoreNumber(num)} — ${name}`,
        })),
      dates: [...dates]
        .sort((a, b) => b.localeCompare(a))
        .map((v) => ({ value: v, label: fmtDate(v) })),
      subs: [...subs.entries()]
        .sort(([, a], [, b]) => a.localeCompare(b))
        .map(([id, desc]) => ({ value: String(id), label: desc })),
      items: [...items.entries()]
        .sort(([, a], [, b]) => a.localeCompare(b))
        .map(([code, desc]) => ({
          value: code,
          label: desc ? `${code} — ${desc}` : code,
        })),
      orderIds: [...orderIds]
        .sort((a, b) => a - b)
        .map((v) => ({ value: String(v), label: `#${v}` })),
    };
  }, [lines]);

  const active =
    filters.orderTypes.length +
    filters.storeNumbers.length +
    filters.dates.length +
    filters.subIds.length +
    filters.productCodes.length +
    filters.orderIds.length;

  const asNumbers = (values: (string | number)[]) => values.map((v) => Number(v));

  return (
    <div
      className="flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white flex-shrink-0"
      style={{ width: 300 }}
    >
      <div className="bg-brand_navy px-3 pt-2 pb-2.5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-custom-white font-medium text-[13px] flex-1 truncate">
            Configuration
          </span>
          <button
            onClick={onOpenSearch}
            title="New search"
            className="text-custom-white/85 hover:text-custom-white transition-colors flex-shrink-0"
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="pt-1.5 mt-1 border-t border-custom-white/[0.08] flex items-baseline gap-2">
          <span className="text-custom-white/85 text-[10px] truncate">
            {scopeLabel}
          </span>
          <span className="text-custom-white/85 text-[10px] flex-shrink-0 ml-auto">
            {fmtDate(startDate)} – {fmtDate(endDate)}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 relative">
          <LoadingIndicator message="Loading orders" />
        </div>
      ) : lines.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-6 text-center">
          <span className="text-[12px] text-content/85">
            Run a search to configure what you see.
          </span>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto thin-scrollbar p-3 flex flex-col gap-3">
            <Field label="Order types">
              <MultiSelectFilter
                options={options.types}
                values={filters.orderTypes}
                onChange={(v) => onChange("orderTypes", v)}
                placeholder="All order types"
                noun="types"
              />
            </Field>

            <Field label="Stores">
              <MultiSelectFilter
                options={options.stores}
                values={filters.storeNumbers}
                onChange={(v) => onChange("storeNumbers", v)}
                placeholder="All stores"
                noun="stores"
              />
            </Field>

            <Field label="Order dates">
              <MultiSelectFilter
                options={options.dates}
                values={filters.dates}
                onChange={(v) => onChange("dates", v)}
                placeholder="All dates"
                noun="dates"
              />
            </Field>

            <Field label="Sub departments">
              <MultiSelectFilter
                options={options.subs}
                values={filters.subIds.map(String)}
                onChange={(v) => onChange("subIds", asNumbers(v))}
                placeholder="All sub departments"
                noun="departments"
              />
            </Field>

            <Field label="Items">
              <MultiSelectFilter
                options={options.items}
                values={filters.productCodes}
                onChange={(v) => onChange("productCodes", v)}
                placeholder="All items"
                noun="items"
              />
            </Field>

            <Field label="Order numbers">
              <MultiSelectFilter
                options={options.orderIds}
                values={filters.orderIds.map(String)}
                onChange={(v) => onChange("orderIds", asNumbers(v))}
                placeholder="All orders"
                noun="orders"
              />
            </Field>
          </div>

          <div className="flex items-center gap-2 border-t border-gray-100 px-3 py-2 flex-shrink-0">
            <span className="text-[11px] text-content/85 flex-1">
              {matched.toLocaleString()} of {lines.length.toLocaleString()} lines
            </span>
            <button
              onClick={onClear}
              disabled={active === 0}
              title="Clear every filter"
              className="flex items-center gap-1 rounded border border-content/20 px-2 py-1 text-[11px] font-medium text-content/85 transition-colors hover:text-content hover:border-content/35 disabled:opacity-50"
            >
              <ArrowPathIcon className="w-3 h-3" />
              Clear{active > 0 ? ` (${active})` : ""}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <span className="block text-[10px] font-semibold uppercase tracking-wide text-content/85 mb-1">
      {label}
    </span>
    {children}
  </div>
);

export default OrdersConfigPanel;
