import { useMemo, useState } from "react";
import { InformationCircleIcon } from "@heroicons/react/16/solid";
import EmptyPrompt from "../../../../components-dev/EmptyPrompt";
import Checkbox from "../../../../components-dev/Checkbox";
import ThresholdFilter from "../../../../components-dev/filters/ThresholdFilter";
import { formatCurrency2 } from "../../../../utils";
import type { AllOrder } from "../../../../interfaces";
import type { OrderDraft } from "../orderEdit";
import {
  commonUnit,
  itemStoreRows,
  type Figures,
  type ProblemItem,
} from "../problemItems";
import { FLAG_LABEL, FLAG_ON } from "./flagStyles";
import { Band } from "./OrderEditPanel";

interface Props {
  /** The item open on the left, or null for the "pick one" state. */
  item: ProblemItem | null;
  /** Where it sits in the still-to-do list, for "3 of 57". */
  position: { index: number; total: number } | null;
  /** Every loaded line. Which orders the fix reaches is the ticks'. */
  scope: AllOrder[];
  all: AllOrder[];
  drafts: Record<string, OrderDraft>;
  /** Stage the unit cost on these orders, then move to the next item. */
  onStage: (docKeys: string[], unit: number) => void;
  onSkip: () => void;
  onLeaveEdit: () => void;
  onSubmit: () => void;
  stagedCount: number;
  submitting: boolean;
}

const fmtOrderDate = (iso: string) => {
  const [y, m, d] = iso.split("T")[0].split("-");
  return `${+m}/${+d}/${y}`;
};

const padStoreNumber = (n: string | number) => String(n).padStart(3, "0");

const pct = (m: number | null) => (m === null ? "—" : `${m.toFixed(1)}%`);

/**
 * One item, across every store that ordered it.
 *
 * Ben's fix in one screen: type the unit cost once, see what every store's
 * case cost, Ext cost and margin become, untick a store that pays something
 * else on purpose, and stage. Unit cost because case size is per store — a
 * case of 12 and a case of 24 at the same unit price are two different case
 * costs, and this table is where that shows.
 *
 * Nothing is sent from here. Stage writes into each order's draft, the same
 * draft a hand edit uses, and Submit sends them with everything else waiting.
 *
 * Keyed on the item by its parent, so the typed cost and the ticks start
 * fresh for each one.
 */
const ItemFixPanel = ({
  item,
  position,
  scope,
  all,
  drafts,
  onStage,
  onSkip,
  onLeaveEdit,
  onSubmit,
  stagedCount,
  submitting,
}: Props) => {
  const [unit, setUnit] = useState<number | null>(null);
  /** Orders left out of the fix. Everything starts ticked: the usual case is
   *  that every store should pay the same, and the exception is unticked. */
  const [unticked, setUnticked] = useState<Set<string>>(new Set());

  const valid = unit !== null && unit > 0;

  const rows = useMemo(
    () =>
      item ? itemStoreRows(item.code, scope, all, drafts, valid ? unit : null) : [],
    [item, scope, all, drafts, unit, valid],
  );
  const hint = useMemo(() => commonUnit(rows), [rows]);

  const ticked = rows.filter((r) => !unticked.has(r.doc.key));
  const willChange = ticked.filter((r) => r.changes);
  const byUnit = rows.filter((r) => r.casesize <= 0).length;

  const submitLabel =
    stagedCount > 1 ? `Submit ${stagedCount} orders` : "Submit order update";

  const header = (
    <Band onLeaveEdit={onLeaveEdit}>
      <span className="min-w-0 truncate text-custom-white font-medium text-[13px]">
        {item ? item.desc || "No description" : "Fix costs"}
      </span>
      {item && (
        <span className="flex-shrink-0 text-custom-white/95 text-[11.5px] tabular-nums">
          {item.code}
          {position ? ` · ${position.index} of ${position.total}` : ""}
        </span>
      )}
      <div className="flex-1" />
      <button
        onClick={onSubmit}
        disabled={stagedCount === 0 || submitting}
        title="Build each changed order's file and submit it for import"
        className="flex-shrink-0 rounded-md bg-custom-white px-3 py-1 text-[11.5px] font-bold text-brand_navy transition-opacity hover:opacity-90 disabled:opacity-45"
      >
        {submitting ? "Submitting…" : submitLabel}
      </button>
    </Band>
  );

  if (!item) {
    return (
      <div className="flex flex-col flex-1 min-w-0 rounded-xl shadow-lg overflow-hidden bg-custom-white">
        {header}
        <div className="flex-1 flex items-center justify-center p-6">
          <EmptyPrompt
            title="Pick an item on the left"
            description="Each one opens here across every store that ordered it. Type the unit cost once, and each store's case cost and Ext cost follow from its own case size."
          />
        </div>
      </div>
    );
  }

  const toggle = (key: string) =>
    setUnticked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className="flex flex-col flex-1 min-w-0 rounded-xl shadow-lg overflow-hidden bg-custom-white">
      {header}

      <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar px-4 py-3 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {item.flags.map((f) => (
            <span
              key={f}
              className={`rounded-full border px-2.5 py-[3px] text-[11px] font-semibold ${FLAG_ON[f]}`}
            >
              {f === "highMargin" && item.topMargin !== null
                ? `Margin up to ${Math.round(item.topMargin)}%`
                : FLAG_LABEL[f]}
            </span>
          ))}
          <span className="text-[12px] text-content/95">
            {rows.length} order{rows.length === 1 ? "" : "s"} across{" "}
            {item.stores} store{item.stores === 1 ? "" : "s"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-content/95">
              New unit cost
            </span>
            <ThresholdFilter
              value={unit === null ? null : { op: "eq", amount: unit }}
              onChange={(v) => setUnit(v === null ? null : v.amount)}
              showOp={false}
              prefix="$"
              placeholder="0.00"
              size="md"
              inputWidth={96}
              ariaLabel="New unit cost"
            />
          </label>
          {hint !== null && (
            <span className="flex items-center gap-1.5 text-[12px] text-content/95">
              Most stores pay
              <button
                onClick={() => setUnit(hint)}
                className="rounded-full border border-filter_active_border bg-filter_active px-2.5 py-[3px] text-[11.5px] font-semibold text-brand_navy hover:bg-row_selected"
              >
                {formatCurrency2(hint)} · use it
              </button>
            </span>
          )}
        </div>

        {byUnit > 0 && (
          <div className="flex items-start gap-2 rounded-lg bg-filter_active border border-filter_active_border px-3 py-2">
            <InformationCircleIcon className="h-4 w-4 flex-shrink-0 text-brand_navy mt-px" />
            <span className="text-[12px] leading-snug text-content">
              {byUnit === rows.length ? "Every store here orders" : `${byUnit} of these orders are`}{" "}
              {byUnit === rows.length ? "this by the unit" : "by the unit"} — no case
              size, so the unit cost goes into the case cost column as it is.
            </span>
          </div>
        )}

        <div className="rounded-lg border border-brand_line overflow-hidden">
          <table className="w-full border-collapse text-[12.5px]">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-semibold uppercase tracking-wide text-content">
                <th className="w-8 px-2.5 py-2" />
                <th className="px-2.5 py-2 text-left">Store · order</th>
                <th className="px-2.5 py-2 text-right">Case</th>
                <th className="px-2.5 py-2 text-right">Unit cost</th>
                <th className="px-2.5 py-2 text-right">Case cost</th>
                <th className="px-2.5 py-2 text-right">Ext cost</th>
                <th className="px-2.5 py-2 text-right">Margin</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const on = !unticked.has(r.doc.key);
                const missing = r.now.caseCost === 0;
                const moving = on && r.changes && r.after !== null;
                return (
                  <tr
                    key={r.doc.key}
                    className={`border-t border-brand_line align-top ${
                      missing ? "bg-severity_critical_bg/60" : ""
                    } ${on ? "" : "opacity-55"}`}
                  >
                    <td className="px-2.5 py-2">
                      <Checkbox
                        checked={on}
                        onChange={() => toggle(r.doc.key)}
                        ariaLabel={`Include ${padStoreNumber(r.doc.storenumber)} order ${r.doc.order_id}`}
                      />
                    </td>
                    <td className="px-2.5 py-2">
                      <span className="block font-semibold text-content tabular-nums">
                        {padStoreNumber(r.doc.storenumber)} — {r.doc.storename}
                      </span>
                      <span className="block text-[11px] text-content/95 tabular-nums">
                        Order {r.doc.order_id} · {fmtOrderDate(r.doc.order_date)} · qty{" "}
                        {r.qty}
                      </span>
                    </td>
                    <td className="px-2.5 py-2 text-right tabular-nums text-content">
                      {r.casesize > 0 ? r.casesize : "by unit"}
                    </td>
                    <td className="px-2.5 py-2 text-right tabular-nums text-content">
                      {formatCurrency2(r.unitNow)}
                    </td>
                    <Change
                      now={r.now}
                      after={moving ? r.after : null}
                      pick={(f) => formatCurrency2(f.caseCost)}
                      unchanged={on && valid && !r.changes}
                    />
                    <Change
                      now={r.now}
                      after={moving ? r.after : null}
                      pick={(f) => formatCurrency2(f.extCost)}
                    />
                    <Change
                      now={r.now}
                      after={moving ? r.after : null}
                      pick={(f) => pct(f.margin)}
                    />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-2.5">
        <span className="text-[12px] text-content/95">
          Staged into each order — sent when you Submit.
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onSkip}
            className="rounded-md border border-brand_line px-3.5 py-1.5 text-[12.5px] font-medium text-content hover:bg-gray-50"
          >
            Skip
          </button>
          <button
            onClick={() =>
              valid && onStage(willChange.map((r) => r.doc.key), unit!)
            }
            disabled={!valid || willChange.length === 0}
            className="rounded-md bg-brand_navy px-4 py-1.5 text-[12.5px] font-semibold text-custom-white hover:bg-brand_navy/85 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {!valid
              ? "Type a unit cost"
              : willChange.length === 0
                ? "Nothing to change"
                : `Stage on ${willChange.length} order${willChange.length === 1 ? "" : "s"} · next`}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * One figure, now and after.
 *
 * "Now → after" only on a row the fix will change; a row already at the typed
 * cost says so, rather than showing the same number twice and leaving the
 * reader to spot that nothing moved.
 */
const Change = ({
  now,
  after,
  pick,
  unchanged = false,
}: {
  now: Figures;
  after: Figures | null;
  pick: (f: Figures) => string;
  unchanged?: boolean;
}) => (
  <td className="px-2.5 py-2 text-right tabular-nums text-content whitespace-nowrap">
    {after ? (
      <>
        <span className="text-content/95">{pick(now)}</span>
        <span className="text-content/95"> → </span>
        <span className="font-bold text-severity_watch_text">{pick(after)}</span>
      </>
    ) : (
      <>
        {pick(now)}
        {unchanged && (
          <span className="block text-[10.5px] text-content/95">no change</span>
        )}
      </>
    )}
  </td>
);

export default ItemFixPanel;
