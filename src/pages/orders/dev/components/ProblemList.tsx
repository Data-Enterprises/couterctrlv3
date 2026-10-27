import { useMemo, useState } from "react";
import { CheckIcon } from "@heroicons/react/16/solid";
import type { OrderFlag } from "../../../../features/dev/devOrdersSlice";
import TextFilter from "../../../../components-dev/filters/TextFilter";
import ThresholdFilter from "../../../../components-dev/filters/ThresholdFilter";
import { workingOrder, type ProblemItem } from "../problemItems";
import { FLAG_DOT, FLAG_LABEL, FLAG_ON } from "./flagStyles";

/** The order the list works in: the cause, its usual symptom, then the one
 *  that is often fine. */
const ROWS: OrderFlag[] = ["missingCost", "highMargin", "noCaseSize"];

interface Props {
  /** Every item on the orders the filters above show, flagged or not. */
  items: ProblemItem[];
  skipped: Set<string>;
  openCode: string | null;
  onPick: (code: string) => void;
  /** The high-margin cutoff. Shared with Browse, so both read the same 60%. */
  marginOver: number | null;
  onMarginOver: (v: number | null) => void;
  scopeOrders: number;
  scopeStores: number;
}

/**
 * The Problems tab: every item with a cost that looks wrong, worst first.
 *
 * One row per UPC rather than per line, because the fix is per UPC — set the
 * unit cost once and every store carrying it follows. The list is the
 * session's to-do: an item fixed here stays, marked staged, and drops to the
 * bottom, so what is left is always at the top.
 *
 * The search reaches every item in scope, flagged or not. A cost can be wrong
 * without tripping a flag — a margin of 45% where 30% is right — and the
 * one-item fix should not depend on the flags having noticed.
 */
const ProblemList = ({
  items,
  skipped,
  openCode,
  onPick,
  marginOver,
  onMarginOver,
  scopeOrders,
  scopeStores,
}: Props) => {
  const [query, setQuery] = useState("");
  const [only, setOnly] = useState<Set<OrderFlag>>(new Set());

  const flagged = useMemo(() => items.filter((i) => i.flags.length > 0), [items]);

  /** How many items carry each flag — items, not lines, since an item is
   *  what gets fixed. */
  const counts = useMemo(() => {
    const c: Record<OrderFlag, number> = {
      missingCost: 0,
      noCaseSize: 0,
      highMargin: 0,
    };
    for (const i of flagged) for (const f of i.flags) c[f] += 1;
    return c;
  }, [flagged]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = q
      ? items.filter(
          (i) => i.code.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q),
        )
      : only.size === 0
        ? flagged
        : flagged.filter((i) => i.flags.some((f) => only.has(f)));
    return workingOrder(pool, skipped);
  }, [items, flagged, query, only, skipped]);

  const toDo = flagged.filter((i) => i.staged === 0 && !skipped.has(i.code)).length;

  const toggle = (f: OrderFlag) =>
    setOnly((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });

  return (
    <>
      <div className="flex-shrink-0 px-3 pb-2 flex flex-col gap-2">
        {/* One row per flag, its count on the right. Chips wrapped onto two
            lines in a 300px panel, and the cutoff sat on a line of its own
            away from the flag it decides; here it is inside that row. A row
            is a toggle, several can be on, the same as the chips were. */}
        <div className="flex flex-col gap-1">
          {ROWS.map((f) => {
            const on = only.has(f);
            const empty = counts[f] === 0;
            return (
              <div
                key={f}
                role="button"
                tabIndex={empty ? -1 : 0}
                aria-pressed={on}
                aria-disabled={empty}
                onClick={() => !empty && toggle(f)}
                onKeyDown={(e) => {
                  if (empty || (e.key !== "Enter" && e.key !== " ")) return;
                  e.preventDefault();
                  toggle(f);
                }}
                className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-[12px] transition-colors ${
                  on
                    ? `${FLAG_ON[f]} font-semibold`
                    : `border-transparent text-content ${
                        empty ? "cursor-default" : "cursor-pointer hover:border-brand_line hover:bg-row_selected"
                      }`
                }`}
              >
                <span className={`h-2 w-2 flex-shrink-0 rounded-[2px] ${FLAG_DOT[f]}`} />
                <span className={empty && !on ? "text-content/95" : ""}>
                  {f === "highMargin" ? "High margin over" : FLAG_LABEL[f]}
                </span>
                {f === "highMargin" && (
                  // Typing the cutoff must not also toggle the row.
                  <span
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <ThresholdFilter
                      value={
                        marginOver === null
                          ? null
                          : { op: "gt", amount: marginOver }
                      }
                      onChange={(v) => onMarginOver(v === null ? null : v.amount)}
                      showOp={false}
                      suffix="%"
                      placeholder="—"
                      inputWidth={44}
                      ariaLabel="High margin cutoff, in percent"
                    />
                  </span>
                )}
                <span className="ml-auto tabular-nums">
                  {counts[f].toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>

        <TextFilter
          value={query}
          onChange={setQuery}
          placeholder="Search any item, flagged or not"
        />
      </div>

      <div className="flex items-center gap-2 px-3 pb-2 flex-shrink-0">
        <span className="text-[11px] text-content/95 tabular-nums flex-1">
          {query.trim()
            ? `${shown.length.toLocaleString()} matching`
            : only.size > 0
              ? `${shown.length.toLocaleString()} of ${flagged.length.toLocaleString()} showing`
              : `${toDo.toLocaleString()} of ${flagged.length.toLocaleString()} still to look at`}
        </span>
        {only.size > 0 && !query.trim() && (
          <button
            onClick={() => setOnly(new Set())}
            className="text-[11px] font-medium text-content/95 underline hover:text-content"
          >
            Show all
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto thin-scrollbar px-3 pb-3 flex flex-col gap-2">
        {shown.length === 0 ? (
          <span className="text-[12px] text-content/95 px-1 py-2">
            {query.trim()
              ? `No item on these orders matches "${query.trim()}".`
              : "Nothing flagged on these orders."}
          </span>
        ) : (
          shown.map((i) => {
            const isOpen = i.code === openCode;
            const done = i.staged > 0;
            const skip = !done && skipped.has(i.code);
            return (
              <button
                key={i.code}
                onClick={() => onPick(i.code)}
                className={`text-left rounded-lg border bg-custom-white px-2.5 py-2 transition-colors ${
                  isOpen
                    ? "border-brand_navy border-l-[3px] bg-row_selected"
                    : "border-brand_line border-l-[3px] border-l-brand_line_2 hover:border-row_selected_border hover:bg-row_selected"
                } ${(done || skip) && !isOpen ? "opacity-70" : ""}`}
              >
                <span className="block text-[12.5px] font-bold text-content truncate">
                  {i.desc || "No description"}
                </span>
                <span className="block text-[11px] text-content/95 tabular-nums truncate">
                  {i.code} · {i.stores} store{i.stores === 1 ? "" : "s"}
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-1">
                  {done ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-severity_healthy_text">
                      <CheckIcon className="h-3 w-3" />
                      Staged · {i.staged} order{i.staged === 1 ? "" : "s"}
                    </span>
                  ) : (
                    <>
                      {i.flags.map((f) => (
                        <span
                          key={f}
                          className={`rounded-full border px-2 py-px text-[10.5px] font-semibold ${FLAG_ON[f]}`}
                        >
                          {f === "highMargin" && i.topMargin !== null
                            ? `Margin ${Math.round(i.topMargin)}%`
                            : FLAG_LABEL[f]}
                        </span>
                      ))}
                      {skip && (
                        <span className="text-[11px] font-semibold text-content/95">
                          Skipped
                        </span>
                      )}
                    </>
                  )}
                </span>
              </button>
            );
          })
        )}
      </div>

      <div className="border-t border-gray-100 px-3 py-2 flex-shrink-0">
        <span className="block text-[11px] leading-snug text-content/95">
          Across the orders the filters above show —{" "}
          {scopeOrders.toLocaleString()} order{scopeOrders === 1 ? "" : "s"},{" "}
          {scopeStores.toLocaleString()} store{scopeStores === 1 ? "" : "s"}. A
          fix reaches only these.
        </span>
      </div>
    </>
  );
};

export default ProblemList;
