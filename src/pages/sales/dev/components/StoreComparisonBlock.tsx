import { useMemo, useState } from "react";
import { formatCurrency2, formatBigNumber } from "../../../../utils";
import { applyStoreNumberToName } from "../shared/ledgerUtils";
import {
  compareForView,
  type ComparisonRow,
  type Excluded,
  type Verdict,
} from "../shared/storeComparison";
import type { LedgerRowData } from "./LedgerRow";
import type { GradingMetric } from "../../../../features/dev/devSalesLedgerSlice";

/**
 * How the open store compares — to its group by default, or to a sibling.
 *
 * Sits between the day strip and the tabs, because it answers the question the
 * store was opened to ask. The tabs below are the same Sub Dept and Hourly
 * views they have always been.
 *
 * The group is the default counterpart because the search already chose it.
 * Naming a specific store is the deviation from that, which is why it is a
 * picker rather than two equal modes.
 */

interface Props {
  rows: LedgerRowData[];
  storeid: number;
  storeNumber: string;
  gradingMetric: GradingMetric;
  threshold: number;
  selectedDate: string | null;
}

const VERDICT_LABEL: Record<Verdict, string> = {
  rising: "Rising",
  consistent: "Consistent",
  falling: "Falling",
};

const VERDICT_CLASS: Record<Verdict, string> = {
  rising: "bg-delta_positive_bg text-delta_positive_text",
  consistent: "bg-gray-100 text-content/85",
  falling: "bg-delta_negative_bg text-delta_negative_text",
};

const EXCLUDED_SAYS: Record<Excluded, string> = {
  "no-last-year": "No matching week last year, so there is no usual share to compare against.",
  "partial-week":
    "Last year covers only part of this week. A partial week understates the usual share, which would make a short week look like a win.",
  "nothing-last-year": "Nothing was recorded last year, so there is no usual share to work out.",
};

const pct1 = (v: number | null) =>
  v === null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;

const points1 = (v: number | null) =>
  v === null ? "—" : `${v >= 0 ? "+" : ""}${v.toFixed(1)} pt`;

const share1 = (v: number | null) => (v === null ? "—" : `${(v * 100).toFixed(1)}%`);

/** Direction only, through the delta tokens. Neutral renders neutral. */
const toneOf = (v: number | null, band = 0) =>
  v === null || Math.abs(v) <= band
    ? "text-content"
    : v > 0
      ? "text-delta_positive_text"
      : "text-delta_negative_text";

const StoreComparisonBlock = ({
  rows,
  storeid,
  storeNumber,
  gradingMetric,
  threshold,
  selectedDate,
}: Props) => {
  const [counterpartKey, setCounterpartKey] = useState<string>("");
  const isQty = gradingMetric === "qty";
  const fmt = (v: number | null) =>
    v === null ? "—" : isQty ? formatBigNumber(v, 0) : formatCurrency2(v);

  const group = useMemo(
    () => compareForView(rows, gradingMetric, threshold, selectedDate),
    [rows, gradingMetric, threshold, selectedDate],
  );

  const keyOf = (r: { storeid: number; storeNumber: string }) =>
    `${r.storeid}__${r.storeNumber}`;

  const mine = group.rows.find(
    (r) => r.storeid === storeid && r.storeNumber === storeNumber,
  );
  const against = counterpartKey
    ? (group.rows.find((r) => keyOf(r) === counterpartKey) ?? null)
    : null;

  // Nothing to compare against in a single-store search: there is no reference
  // set, so the block says nothing rather than half-offering one.
  if (!mine || rows.length < 2) return null;

  const nameOf = (r: ComparisonRow) =>
    applyStoreNumberToName(r.storeName, r.storeNumber, r.storeNumbersForId);

  const others = group.rows.filter((r) => keyOf(r) !== keyOf(mine));

  return (
    <div className="flex-shrink-0 border-b border-gray-100 bg-gray-50">
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-content/85">
          Against
        </span>
        <select
          value={counterpartKey}
          onChange={(e) => setCounterpartKey(e.target.value)}
          className="basic-input bg-custom-white text-[12px] py-1 px-2 max-w-[220px]"
          style={{ outline: "none", boxShadow: "none" }}
        >
          <option value="">The group ({group.counted} stores)</option>
          {others.map((r) => (
            <option key={keyOf(r)} value={keyOf(r)}>
              {nameOf(r)}
            </option>
          ))}
        </select>

        {mine.verdict ? (
          <span
            className={`ml-auto text-[11px] font-semibold px-2 py-0.5 rounded ${VERDICT_CLASS[mine.verdict]}`}
          >
            {VERDICT_LABEL[mine.verdict]}
          </span>
        ) : (
          <span
            className="ml-auto text-[11px] font-semibold px-2 py-0.5 rounded bg-severity_watch_bg text-severity_watch_text"
            title={mine.excluded ? EXCLUDED_SAYS[mine.excluded] : undefined}
          >
            Not comparable
          </span>
        )}
      </div>

      {against === null ? (
        <AgainstGroup
          row={mine}
          counted={group.counted}
          fmt={fmt}
          threshold={threshold}
        />
      ) : (
        <AgainstStore a={mine} b={against} nameOf={nameOf} fmt={fmt} />
      )}
    </div>
  );
};

/**
 * The store against the group, full size.
 *
 * The dollar impact is stated in words because it is the figure somebody acts
 * on, and "−$34k against its usual share" is a sentence a manager can take to
 * a meeting in a way that a column of numbers is not.
 */
const AgainstGroup = ({
  row,
  counted,
  fmt,
  threshold,
}: {
  row: ComparisonRow;
  counted: number;
  fmt: (v: number | null) => string;
  threshold: number;
}) => {
  if (row.excluded) {
    return (
      <p className="px-3 pb-2.5 text-[12px] text-content/85 max-w-[62ch]">
        {EXCLUDED_SAYS[row.excluded]}
      </p>
    );
  }

  const short = row.gapValue !== null && row.gapValue < 0;

  return (
    <div className="px-3 pb-2.5">
      <p className="text-[12.5px] text-content max-w-[66ch]">
        Holding{" "}
        <strong className="font-semibold">{share1(row.contribution)}</strong> of
        the group, against the{" "}
        <strong className="font-semibold">{share1(row.usualShare)}</strong> it
        usually holds
        {row.rank !== null && (
          <>
            {" "}
            &middot; <strong className="font-semibold">{row.rank}</strong> of{" "}
            {counted}
          </>
        )}
        .{" "}
        {short ? (
          <>
            Had it held that share, the group would be{" "}
            <strong className="font-semibold">
              {fmt(Math.abs(row.gapValue as number))}
            </strong>{" "}
            better this week.
          </>
        ) : (
          <>
            That is{" "}
            <strong className="font-semibold">{fmt(row.gapValue)}</strong> above
            what its usual share predicts.
          </>
        )}
      </p>

      <div className="grid grid-cols-4 gap-x-4 gap-y-1.5 mt-2.5 border-t border-gray-100 pt-2">
        <Fact label="Expected" value={fmt(row.expected)} />
        <Fact
          label="Gap"
          value={fmt(row.gapValue)}
          className={toneOf(row.gapValue)}
        />
        <Fact
          label="Gap %"
          value={pct1(row.gapPct)}
          className={toneOf(row.gapPct, threshold)}
        />
        <Fact
          label="Share change"
          value={points1(row.shareDelta)}
          className={toneOf(row.shareDelta)}
        />
      </div>
    </div>
  );
};

/**
 * One store against another, on rates and movement.
 *
 * Deliberately not the two dollar totals: those only restate which store is
 * bigger, which the ledger already said. What a comparison is for is "A is
 * −9.8% against last year, B is +6.9%, that is a 16.7 point gap" — and a gap
 * between two percentages is in points, not percent.
 */
const AgainstStore = ({
  a,
  b,
  nameOf,
  fmt,
}: {
  a: ComparisonRow;
  b: ComparisonRow;
  nameOf: (r: ComparisonRow) => string;
  fmt: (v: number | null) => string;
}) => {
  const measures: {
    label: string;
    av: number | null;
    bv: number | null;
    show: (v: number | null) => string;
  }[] = [
    { label: "vs last year", av: a.ownPct, bv: b.ownPct, show: pct1 },
    { label: "Gap vs expected", av: a.gapPct, bv: b.gapPct, show: pct1 },
    {
      label: "Share of group",
      av: a.contribution === null ? null : a.contribution * 100,
      bv: b.contribution === null ? null : b.contribution * 100,
      show: (v) => (v === null ? "—" : `${v.toFixed(1)}%`),
    },
    { label: "Share change", av: a.shareDelta, bv: b.shareDelta, show: points1 },
  ];

  return (
    <div className="px-3 pb-2.5">
      <div className="grid grid-cols-[1fr_84px_84px_78px] gap-x-3 items-baseline border-b border-gray-100 pb-1">
        <span />
        <span className="text-[10.5px] font-bold uppercase tracking-wide text-content/85 text-right truncate" title={nameOf(a)}>
          {nameOf(a)}
        </span>
        <span className="text-[10.5px] font-bold uppercase tracking-wide text-content/85 text-right truncate" title={nameOf(b)}>
          {nameOf(b)}
        </span>
        <span className="text-[10.5px] font-bold uppercase tracking-wide text-content/85 text-right">
          Gap
        </span>
      </div>

      {measures.map((m) => {
        // Both sides are already percentages or points, so the distance
        // between them is points — subtracting two percentages never gives a
        // percentage.
        const gap = m.av === null || m.bv === null ? null : m.av - m.bv;
        return (
          <div
            key={m.label}
            className="grid grid-cols-[1fr_84px_84px_78px] gap-x-3 items-baseline py-1 border-b border-gray-50"
          >
            <span className="text-[12px] text-content/85">{m.label}</span>
            <span className="text-[12.5px] tabular-nums text-right text-content">
              {m.show(m.av)}
            </span>
            <span className="text-[12.5px] tabular-nums text-right text-content">
              {m.show(m.bv)}
            </span>
            <span
              className={`text-[12.5px] tabular-nums text-right font-semibold ${toneOf(gap)}`}
            >
              {points1(gap)}
            </span>
          </div>
        );
      })}

      {/* Size, stated once and kept out of the comparison above — it is
          context for the rates, not a measure of who did better. */}
      <div className="grid grid-cols-[1fr_84px_84px_78px] gap-x-3 items-baseline pt-1.5">
        <span className="text-[11px] text-content/85">Size this week</span>
        <span className="text-[11.5px] tabular-nums text-right text-content/85">
          {fmt(a.ty)}
        </span>
        <span className="text-[11.5px] tabular-nums text-right text-content/85">
          {fmt(b.ty)}
        </span>
        {/* Ranks only when the group is big enough to have them — see
            MIN_STORES_FOR_RANK. */}
        <span className="text-[11px] text-right text-content/85">
          {a.rank !== null && b.rank !== null ? `#${a.rank} / #${b.rank}` : ""}
        </span>
      </div>
    </div>
  );
};

const Fact = ({
  label,
  value,
  className = "text-content",
}: {
  label: string;
  value: string;
  className?: string;
}) => (
  <div className="min-w-0">
    <div className="text-[10px] font-bold uppercase tracking-wide text-content/85">
      {label}
    </div>
    <div className={`text-[13px] font-semibold tabular-nums truncate ${className}`}>
      {value}
    </div>
  </div>
);

export default StoreComparisonBlock;
