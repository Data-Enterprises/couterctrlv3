import { useMemo, useState } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/16/solid";
import { formatCurrency2 } from "../../../../utils";
import type { AllOrder } from "../../../../interfaces";
import { stagePreview, unitCostOf } from "../orderEdit";

interface Props {
  /** Every line loaded — the item is searched across all of them. */
  scope: AllOrder[];
  /** Every line the search returned; a draft holds the whole order. */
  all: AllOrder[];
  /** Stage the cost into the drafts. Nothing is sent from here. */
  onStage: (itemRows: AllOrder[], unit: number) => void;
  onClose: () => void;
}

/**
 * Find an item, set its unit cost on every loaded order that carries it.
 *
 * **Changes the screen and nothing else.** It stages the cost into each
 * order's draft and closes; the orders go out when Submit is pressed, like any
 * other edit. A modal that wrote order files was a bigger action than it
 * looked, and the Submit button is where that decision already lives.
 *
 * Opens only in Edit mode, which is where drafts exist to stage into.
 *
 * The item is chosen here by search, and the orders follow from it: every
 * loaded order carrying that item is listed before anything is staged, so you
 * see exactly which orders the fix will touch.
 *
 * In unit cost because case size is per store: a case of 12 and a case of 24
 * are the same item at the same unit price and two different case costs. The
 * per-store list shows the case cost each order will carry before it is
 * staged, since that is the number that lands in the file.
 */
const FixCostModal = ({ scope, all, onStage, onClose }: Props) => {
  /**
   * Every item in scope, with how many orders carry it.
   *
   * `description` is typed as a string and can arrive null — an order line
   * for an item the catalog has no name for. Sorting on it crashed the whole
   * page the moment this opened. So each item takes the first real
   * description any of its lines carries, and one with none at all sorts
   * last under its code rather than taking the page down.
   */
  const items = useMemo(() => {
    const m = new Map<string, { desc: string; orders: Set<string> }>();
    for (const r of scope) {
      const code = String(r.product_code);
      const desc = (r.description ?? "").trim();
      const e = m.get(code) ?? { desc: "", orders: new Set<string>() };
      if (!e.desc && desc) e.desc = desc;
      e.orders.add(`${r.storeid}|${r.storenumber}|${r.order_id}|${r.order_date}`);
      m.set(code, e);
    }
    return [...m.entries()]
      .map(([code, e]) => ({ code, desc: e.desc, orders: e.orders.size }))
      .sort(
        (a, b) =>
          Number(!a.desc) - Number(!b.desc) ||
          a.desc.localeCompare(b.desc) ||
          a.code.localeCompare(b.code),
      );
  }, [scope]);

  // A scope that is already one item opens on it.
  const [code, setCode] = useState(items.length === 1 ? items[0].code : "");
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) => i.code.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q),
    );
  }, [items, query]);

  const itemRows = useMemo(
    () => scope.filter((r) => String(r.product_code) === code),
    [scope, code],
  );
  const chosen = items.find((i) => i.code === code) ?? null;

  // Start on the cost already there when the stores agree on one, so a
  // correction is an edit rather than a retype.
  const current = useMemo(() => {
    const costs = new Set(
      itemRows.filter((r) => r.base_cost).map((r) => unitCostOf(r).toFixed(2)),
    );
    return costs.size === 1 ? [...costs][0] : "";
  }, [itemRows]);

  const [unitText, setUnitText] = useState<string | null>(null);
  const shownUnit = unitText ?? current;
  const unit = Number(shownUnit);
  const valid = shownUnit.trim() !== "" && Number.isFinite(unit) && unit >= 0;

  const preview = useMemo(
    () => (chosen && valid ? stagePreview(itemRows, all, unit) : []),
    [chosen, valid, itemRows, all, unit],
  );
  const stores = new Set(preview.map((p) => p.doc.storenumber)).size;

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
            Fix cost
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
          {!chosen ? (
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-content/85">
                Item
              </span>
              <div className="flex items-center gap-1.5 rounded border border-brand_navy/75 bg-custom-white px-2">
                <MagnifyingGlassIcon className="h-3.5 w-3.5 flex-shrink-0 text-content/85" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search description or UPC"
                  className="min-w-0 flex-1 border-0 bg-transparent py-1.5 text-[13px] text-content placeholder:text-content/55"
                  style={{ outline: "none", boxShadow: "none" }}
                />
              </div>
              <div className="flex max-h-[320px] flex-col overflow-y-auto thin-scrollbar rounded-lg border border-gray-200">
                {shown.length === 0 ? (
                  <span className="px-3 py-3 text-[12px] text-content/85">
                    No loaded order carries &ldquo;{query.trim()}&rdquo;.
                  </span>
                ) : (
                  shown.map((i) => (
                    <button
                      key={i.code}
                      onClick={() => setCode(i.code)}
                      className="flex items-baseline gap-3 border-t border-gray-100 px-3 py-2 text-left first:border-t-0 hover:bg-row_selected"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-medium text-content">
                          {i.desc || "No description"}
                        </span>
                        <span className="block text-[11px] tabular-nums text-content/85">
                          {i.code}
                        </span>
                      </span>
                      <span className="flex-shrink-0 text-[11px] tabular-nums text-content/85">
                        {i.orders} order{i.orders === 1 ? "" : "s"}
                      </span>
                    </button>
                  ))
                )}
              </div>
              <span className="text-[11.5px] text-content/85">
                {items.length.toLocaleString()} items across every loaded
                order.
              </span>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-gray-200 px-3 py-2.5">
                <div className="flex items-baseline gap-2">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[13px] font-bold text-content">
                      {chosen.desc || "No description"}
                    </span>
                    <span className="block text-[11px] tabular-nums text-content/85">
                      {chosen.code} · {itemRows.length} line
                      {itemRows.length === 1 ? "" : "s"} across {stores} store
                      {stores === 1 ? "" : "s"} and {preview.length} order
                      {preview.length === 1 ? "" : "s"}
                    </span>
                  </span>
                  {items.length > 1 && (
                    <button
                      onClick={() => {
                        setCode("");
                        setUnitText(null);
                      }}
                      className="flex-shrink-0 text-[11.5px] font-semibold text-brand_navy underline underline-offset-2"
                    >
                      Change
                    </button>
                  )}
                </div>
              </div>

              <div>
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-content/85">
                  New unit cost
                </span>
                <div className="flex items-center gap-1 rounded border border-brand_navy/75 bg-custom-white px-2">
                  <span className="text-[13px] text-content/85">$</span>
                  <input
                    autoFocus
                    type="number"
                    min={0}
                    step={0.01}
                    value={shownUnit}
                    onChange={(e) => setUnitText(e.target.value)}
                    className="min-w-0 flex-1 border-0 bg-transparent py-1.5 text-[13px] tabular-nums text-content"
                    style={{ outline: "none", boxShadow: "none" }}
                  />
                </div>
              </div>

              {preview.length > 0 && (
                <div className="rounded-lg border border-gray-200 px-3 py-2">
                  <div className="mb-1 font-display text-[12.5px] font-bold text-content">
                    Per store
                  </div>
                  {preview.map((p) => (
                    <div
                      key={p.doc.key}
                      className="flex items-baseline gap-3 border-t border-gray-100 py-1.5 text-[12px] first:border-t-0"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-content">
                          {p.doc.storenumber} — {p.doc.storename}
                        </div>
                        <div className="text-[10.5px] text-content/85">
                          Order {p.doc.order_id}
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right tabular-nums">
                        <span className="text-content/85">
                          case of {p.casesize > 0 ? p.casesize : "—"} →{" "}
                        </span>
                        <b className="font-semibold text-content">
                          {formatCurrency2(p.newCaseCost)}
                        </b>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-gray-100 px-4 py-2.5 flex-shrink-0">
          <span className="flex-1 text-[12px] text-content/85">
            {chosen && preview.length > 0
              ? "Staged into each order — sent when you Submit."
              : ""}
          </span>
          <button
            onClick={onClose}
            className="rounded border border-content/20 px-3 py-1 text-[12px] font-medium text-content/85 transition-colors hover:border-content/35 hover:text-content"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onStage(itemRows, unit);
              onClose();
            }}
            disabled={!chosen || !valid || preview.length === 0}
            className="rounded bg-brand_navy px-3 py-1 text-[12px] font-semibold text-custom-white transition-colors hover:bg-brand_navy_hover disabled:opacity-50"
          >
            Stage on {preview.length || ""} order{preview.length === 1 ? "" : "s"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FixCostModal;
