import { useMemo, useState } from "react";
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/16/solid";
import MultiSelectFilter from "../../../../components-dev/filters/MultiSelectFilter";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import type { AllOrder } from "../../../../interfaces";
import type { OrdersFilters } from "../../../../features/dev/devOrdersSlice";
import { buildRows, type SortKey } from "../ordersRows";
import { ORDER_EXPORT_COLUMNS } from "../ordersExportColumns";

interface Props {
  /** Every line the search returned, before any filter. */
  lines: AllOrder[];
  /** What the left panel has selected — the modal opens on this. */
  filters: OrdersFilters;
  /** The grid's sort, so the file comes out in the order on screen. */
  applySort: (
    rows: AllOrder[],
    value: (row: AllOrder, col: SortKey) => number | null,
  ) => AllOrder[];
  /** For the default file name. */
  scopeLabel: string;
  startDate: string;
  endDate: string;
  onClose: () => void;
}

const slug = (s: string) => s.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "");

const csvCell = (v: unknown) => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/**
 * Export, as the grid you are already looking at.
 *
 * The page used to carry preset sections — all orders, the selected order, by
 * sub department — because the export was the only place that could narrow
 * anything. The configuration panel does that now, so the presets were three
 * names for "the rows on screen" and the modal is the simpler thing: name it,
 * choose columns, go.
 *
 * It opens on the panel's filters rather than ignoring them, and they stay
 * editable here — the common case is the file you are looking at, and the
 * next most common is that file for one more store, without disturbing the
 * screen to get it.
 *
 * The grid's sort rides along, so the file comes out in the order you were
 * reading it — including the list's own order when nothing is sorted. Before
 * that it wrote whatever order the API returned and nobody could tell.
 */
const OrdersExportModal = ({
  lines,
  filters,
  applySort,
  scopeLabel,
  startDate,
  endDate,
  onClose,
}: Props) => {
  const toast = useToast();

  const [draft, setDraft] = useState<OrdersFilters>(filters);
  const [columns, setColumns] = useState<string[]>([]);
  const [name, setName] = useState(
    `${slug(scopeLabel)}_${slug(startDate)}_${slug(endDate)}`,
  );

  const rows = useMemo(
    () => buildRows(lines, draft, applySort),
    [lines, draft, applySort],
  );

  /** Empty means every column, the same way the filters read. */
  const chosen = useMemo(
    () =>
      columns.length === 0
        ? ORDER_EXPORT_COLUMNS
        : ORDER_EXPORT_COLUMNS.filter((c) => columns.includes(c.field)),
    [columns],
  );

  /** Options come off the lines, not the type, so nothing offered is absent. */
  const options = useMemo(() => {
    const types = new Set<string>();
    const stores = new Map<string, string>();
    const dates = new Set<string>();
    const subs = new Map<number, string>();
    const codes = new Map<string, string>();
    const ids = new Set<number>();
    for (const o of lines) {
      if (o.order_type) types.add(o.order_type);
      if (o.storenumber) stores.set(o.storenumber, o.storename ?? o.storenumber);
      if (o.order_date) dates.add(o.order_date);
      if (o.sub_department != null)
        subs.set(o.sub_department, o.sub_department_description ?? "No department");
      if (o.product_code) codes.set(String(o.product_code), o.description ?? "");
      if (o.order_id != null) ids.add(o.order_id);
    }
    const d = (iso: string) => {
      const [y, m, dd] = iso.split("T")[0].split("-");
      return `${+m}/${+dd}/${y}`;
    };
    return {
      types: [...types].sort().map((v) => ({ value: v, label: v })),
      stores: [...stores.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([n, nm]) => ({ value: n, label: `${n} — ${nm}` })),
      dates: [...dates].sort((a, b) => b.localeCompare(a)).map((v) => ({ value: v, label: d(v) })),
      subs: [...subs.entries()]
        .sort(([, a], [, b]) => a.localeCompare(b))
        .map(([id, desc]) => ({ value: String(id), label: desc })),
      codes: [...codes.entries()]
        .sort(([, a], [, b]) => a.localeCompare(b))
        .map(([c, desc]) => ({ value: c, label: desc ? `${c} — ${desc}` : c })),
      ids: [...ids].sort((a, b) => a - b).map((v) => ({ value: String(v), label: `#${v}` })),
    };
  }, [lines]);

  const set = (key: keyof OrdersFilters, values: (string | number)[]) =>
    setDraft((d) => ({ ...d, [key]: values }));

  const handleExport = () => {
    if (!name.trim()) {
      toast.warn("Name the file before exporting.");
      return;
    }
    if (rows.length === 0) {
      toast.warn("Nothing to export with these filters.");
      return;
    }

    const header = chosen.map((c) => csvCell(c.headerName)).join(",");
    const body = rows
      .map((r) => chosen.map((c) => csvCell(r[c.field as keyof AllOrder])).join(","))
      .join("\n");

    const blob = new Blob([`${header}\n${body}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.trim().replace(/\.csv$/i, "")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-[560px] max-w-[94vw] flex-col overflow-hidden rounded-xl bg-custom-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 bg-brand_navy px-4 py-2.5 flex-shrink-0">
          <span className="flex-1 text-[13px] font-medium text-custom-white">
            Export order lines
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-custom-white/85 transition-colors hover:text-custom-white"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto thin-scrollbar p-4 flex flex-col gap-4">
          <div>
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-content/85">
              File name
            </span>
            <div className="flex items-center rounded border border-brand_navy/75 bg-custom-white px-2">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleExport()}
                className="min-w-0 flex-1 border-0 bg-transparent py-1.5 text-[13px] text-content"
                style={{ outline: "none", boxShadow: "none" }}
              />
              <span className="flex-shrink-0 text-[12px] text-content/85">.csv</span>
            </div>
          </div>

          <div>
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-content/85">
              Columns
            </span>
            <MultiSelectFilter
              options={ORDER_EXPORT_COLUMNS.map((c) => ({
                value: c.field,
                label: c.headerName,
              }))}
              values={columns}
              onChange={(v) => setColumns(v)}
              placeholder={`All ${ORDER_EXPORT_COLUMNS.length} columns`}
              noun="columns"
            />
          </div>

          <div>
            <div className="mb-2 flex items-baseline gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-content/85">
                Filters
              </span>
              <span className="text-[11px] text-content/85">
                opened on what the panel has selected
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Order types">
                <MultiSelectFilter
                  options={options.types}
                  values={draft.orderTypes}
                  onChange={(v) => set("orderTypes", v)}
                  placeholder="All order types"
                  noun="types"
                />
              </Field>
              <Field label="Stores">
                <MultiSelectFilter
                  options={options.stores}
                  values={draft.storeNumbers}
                  onChange={(v) => set("storeNumbers", v)}
                  placeholder="All stores"
                  noun="stores"
                />
              </Field>
              <Field label="Order dates">
                <MultiSelectFilter
                  options={options.dates}
                  values={draft.dates}
                  onChange={(v) => set("dates", v)}
                  placeholder="All dates"
                  noun="dates"
                />
              </Field>
              <Field label="Sub departments">
                <MultiSelectFilter
                  options={options.subs}
                  values={draft.subIds.map(String)}
                  onChange={(v) => set("subIds", v.map(Number))}
                  placeholder="All sub departments"
                  noun="departments"
                />
              </Field>
              <Field label="Items">
                <MultiSelectFilter
                  options={options.codes}
                  values={draft.productCodes}
                  onChange={(v) => set("productCodes", v)}
                  placeholder="All items"
                  noun="items"
                />
              </Field>
              <Field label="Order numbers">
                <MultiSelectFilter
                  options={options.ids}
                  values={draft.orderIds.map(String)}
                  onChange={(v) => set("orderIds", v.map(Number))}
                  placeholder="All orders"
                  noun="orders"
                />
              </Field>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-gray-100 px-4 py-2.5 flex-shrink-0">
          <span className="flex-1 text-[12px] text-content/85">
            {rows.length.toLocaleString()} line{rows.length === 1 ? "" : "s"} ·{" "}
            {chosen.length} column{chosen.length === 1 ? "" : "s"}
          </span>
          <button
            onClick={onClose}
            className="rounded border border-content/20 px-3 py-1 text-[12px] font-medium text-content/85 transition-colors hover:border-content/35 hover:text-content"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={rows.length === 0}
            className="flex items-center gap-1.5 rounded bg-brand_navy px-3 py-1 text-[12px] font-semibold text-custom-white transition-colors hover:bg-brand_navy_hover disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <span className="mb-1 block text-[10px] font-medium text-content/85">
      {label}
    </span>
    {children}
  </div>
);

export default OrdersExportModal;
