import { useMemo } from "react";
import { useAppSelector } from "../../../hooks";
import { formatCurrency2, getStoreName } from "../../../utils";
import { severityDotClass, type Severity } from "../../../utils/severity";
import {
  bandOf,
  buildStandings,
  distanceOf,
  isTerminal,
  type Band,
  type CashierStanding,
} from "./rollupStats";
import {
  standingVerdict,
  storeContext,
  type LpVerdict,
} from "../case/caseVerdict";

/**
 * Everyone in scope, split by the only question anyone acts on: is this one
 * worth opening?
 *
 * The rule is the reader's own — over their store's weekly average, or over
 * the group's, or over either in money — so the two sections are that rule
 * applied and nothing else. Under the volume floor is filed with the calm
 * ones: three cancels clearing an average at a quiet store is arithmetic, not
 * a finding.
 *
 * Two shapes, one list. `grid` is the store panel's full table, where the
 * columns are the argument — a reader who disagrees with the split can see
 * which number produced it. `column` is the roster that stays beside an open
 * case, and it is the Performance row verbatim: severity dot, name, a
 * secondary line, figures right. The same row Sales, LP and Item Actions
 * draw, so a reader who has used any of them already knows this one.
 *
 * Built from call 1's rollup rather than the graded call — that one is
 * filtered to the cashiers past the enrichment threshold, so an average taken
 * from it is the average of the outliers and every outlier sits under it.
 */
interface Props {
  /** Null shows every exception; a value narrows to one. */
  saleType: string | null;
  /** Null spans stores, which is when the row carries its store. */
  storeid: number | null;
  onOpen: (s: CashierStanding) => void;
  variant?: "grid" | "column";
  /** The case currently open, so the roster can say which row it belongs to. */
  selected?: { storeid: number; cashierNumber: number } | null;
  /** Whether the calm section is open. Held by the caller so it survives a
   *  move between cashiers. */
  showQuiet?: boolean;
  onToggleQuiet?: () => void;
}

/** The band maps onto the app's three tiers, so the roster's dot is the same
 *  dot every other graded list draws. Over both averages is critical, over one
 *  is watch, and the rest have not moved. */
const SEV_OF: Record<Band, Severity> = {
  case: "critical",
  word: "watch",
  quiet: "healthy",
};

/** The chip's fill. Calm patterns are grey on purpose — "store-wide" and
 *  "a lane" are reasons NOT to open a row, and colouring them would put them
 *  in the same register as a finding. */
const CHIP_TONE: Record<LpVerdict["tone"], string> = {
  hot: "bg-severity_critical_bg text-severity_critical_text",
  mid: "bg-severity_watch_bg text-severity_watch_text",
  calm: "bg-gray-100 text-content/85",
};

const isSame = (
  s: CashierStanding,
  sel: { storeid: number; cashierNumber: number } | null | undefined,
) =>
  !!sel && sel.storeid === s.storeid && sel.cashierNumber === s.cashierNumber;

const LpWhoList = ({
  saleType,
  storeid,
  onOpen,
  variant = "grid",
  selected = null,
  showQuiet = false,
  onToggleQuiet,
}: Props) => {
  const { rollupRows, windows } = useAppSelector((s) => s.lpActions);
  const assignedStores = useAppSelector((s) => s.user.assignedStores);
  const weekCount = windows.length;

  const scoped = useMemo(() => {
    const all = buildStandings(rollupRows, weekCount).filter(
      (s) =>
        (saleType === null || s.saleType === saleType) &&
        (storeid === null || s.storeid === storeid),
    );
    return all.sort((a, b) => {
      const band = { case: 0, word: 1, quiet: 2 } as const;
      const d = band[bandOf(a)] - band[bandOf(b)];
      return d !== 0 ? d : distanceOf(b) - distanceOf(a);
    });
  }, [rollupRows, weekCount, saleType, storeid]);

  /**
   * The denominator behind the share column — the whole window, matching the
   * value column. The panel is about four weeks; a one-week share sitting
   * beside four-week figures read as the same period.
   */
  const scopeTotal = useMemo(
    () => scoped.reduce((sum, s) => sum + s.total, 0),
    [scoped],
  );

  /** The reader's rule, as two lists. Over either average is a case to open;
   *  everyone else is on the roster because they exist, not because they moved. */
  const investigate = scoped.filter((s) => bandOf(s) !== "quiet");
  const cleared = scoped.filter((s) => bandOf(s) === "quiet");

  if (scoped.length === 0)
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <p className="text-[12px] text-content/85 text-center max-w-[46ch] leading-relaxed">
          Nobody rang this exception in the searched weeks.
        </p>
      </div>
    );

  const scopeWord = storeid === null ? "group" : "store";

  /**
   * What the roster can say before any receipts are fetched.
   *
   * Call 1 alone answers three of the patterns — new behaviour, persistent,
   * value-not-count — and, crucially, whether the whole store moved. A chip
   * reading "New behaviour" beside a count is the reason to click THAT row
   * rather than the biggest one, which is the job the list never did.
   */
  const weekIndex = weekCount - 1;
  const ctx = storeContext(scoped, weekIndex);

  /** The Performance section head: a quiet rule with a label on it, not a
   *  coloured band. The dots inside carry the severity. */
  const sectionHead =
    "px-3 py-1.5 bg-gray-50 border-y border-[#1e2a4a]/15 text-[11.5px] font-semibold uppercase tracking-wide text-content/85";

  /* ── the roster beside an open case ─────────────────────────────────── */

  if (variant === "column") {
    const Row = ({ s }: { s: CashierStanding }) => {
      const on = isSame(s, selected);
      const v = standingVerdict(s, weekIndex, ctx);
      return (
        <button
          onClick={() => onOpen(s)}
          title={`${s.cashierName} — ${s.total} over ${windows.length} weeks`}
          className={`w-full flex items-center gap-2.5 p-3 text-left transition-colors border-l-2 border-b border-b-[#1e2a4a]/15 ${
            on
              ? "bg-row_selected border-row_selected_border"
              : "border-transparent hover:bg-gray-50"
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${severityDotClass[SEV_OF[bandOf(s)]]}`}
          />
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium text-content truncate">
              {s.cashierName}
            </div>
            <div className="text-[12px] text-content/85 truncate">
              {/* On All the same person has a row per exception, so the type
                  is what tells the two apart — the number does not. */}
              {saleType === null
                ? s.saleType
                : isTerminal(s)
                  ? "A lane, not a person"
                  : `No. ${s.cashierNumber}`}{" "}
              · <span className="font-semibold">{s.perWeek.toFixed(1)}</span>/wk
            </div>
            {/* What KIND, not how loud. A count says which row is biggest; the
                chip says which one is worth opening, and they are regularly
                not the same row. */}
            {v.pattern !== "routine" && (
              <div
                className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[12px] font-semibold ${CHIP_TONE[v.tone]}`}
                title={v.evidence}
              >
                {v.label}
              </div>
            )}
          </div>
          <span className="text-[13px] font-semibold text-content flex-shrink-0 tabular-nums">
            {s.total}
          </span>
        </button>
      );
    };

    return (
      <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
        <div className={`sticky top-0 z-10 ${sectionHead} border-t-0`}>
          Investigate ({investigate.length})
        </div>
        {investigate.length === 0 ? (
          <p className="px-3 py-2.5 text-[12px] text-content/85">
            Nobody here is over either average.
          </p>
        ) : (
          investigate.map((s) => (
            <Row key={`${s.storeid}-${s.cashierNumber}-${s.saleType}`} s={s} />
          ))
        )}

        {cleared.length > 0 && (
          <>
            <button
              onClick={onToggleQuiet}
              className={`w-full text-left hover:bg-gray-100 transition-colors ${sectionHead}`}
            >
              Not flagged ({cleared.length}) {showQuiet ? "▾" : "▸"}
            </button>
            {showQuiet &&
              cleared.map((s) => (
                <Row
                  key={`${s.storeid}-${s.cashierNumber}-${s.saleType}`}
                  s={s}
                />
              ))}
          </>
        )}
      </div>
    );
  }

  /* ── the store panel's table ────────────────────────────────────────── */

  const th =
    "text-[11.5px] font-semibold uppercase tracking-wide text-content/80 px-3 py-2 bg-gray-50 border-b border-[#1e2a4a]/15 whitespace-nowrap";
  const td = "px-3 py-2 border-b border-[#1e2a4a]/15 tabular-nums";
  const cols = scopeTotal > 0 ? 6 : 5;

  const Rows = ({ list }: { list: CashierStanding[] }) => (
    <>
      {list.map((s) => (
        <tr
          key={`${s.storeid}-${s.cashierNumber}-${s.saleType}`}
          onClick={() => onOpen(s)}
          title={`Open ${s.cashierName}`}
          className="cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <td className={`${td} text-left`}>
            <div className="flex items-center gap-2.5">
              <span
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${severityDotClass[SEV_OF[bandOf(s)]]}`}
              />
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-content truncate">
                  {s.cashierName}{" "}
                  <span className="text-[12px] text-content/85">
                    {s.cashierNumber}
                  </span>
                </div>
                {(storeid === null || saleType === null || isTerminal(s)) && (
                  <div className="text-[12px] text-content/85 truncate">
                    {storeid === null
                      ? getStoreName(assignedStores, s.storeid, s.storeName)
                      : ""}
                    {storeid === null && saleType === null ? " · " : ""}
                    {saleType === null ? s.saleType : ""}
                    {/* A lane behaving oddly is worth knowing; it is just not
                        a case about anybody. */}
                    {isTerminal(s) &&
                      (storeid === null || saleType === null
                        ? " · A lane"
                        : "A lane, not a person")}
                  </div>
                )}
              </div>
            </div>
          </td>
          <td className={`${td} text-right text-[13px] font-semibold`}>
            {s.total}
          </td>
          {scopeTotal > 0 && (
            <td className={`${td} text-right text-[13px] text-content/85`}>
              {Math.round((s.total / scopeTotal) * 100)}%
            </td>
          )}
          <td className={`${td} text-right text-[13px] font-semibold`}>
            {s.perWeek.toFixed(1)}
          </td>
          <td className={`${td} text-right text-[13px] text-content/85`}>
            {formatCurrency2(s.totalSales)}
          </td>
          <td className={`${td} text-content/85 w-5`}>›</td>
        </tr>
      ))}
    </>
  );

  return (
    <div className="flex-1 min-h-0 overflow-auto thin-scrollbar">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10">
          <tr>
            <th className={`${th} text-left`}>Cashier</th>
            <th className={`${th} text-right`}>Total</th>
            {scopeTotal > 0 && <th className={`${th} text-right`}>Share</th>}
            <th className={`${th} text-right`}>Per week</th>
            <th className={`${th} text-right`}>Value</th>
            <th className={`${th} w-5`} />
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={cols} className={sectionHead}>
              Investigate ({investigate.length}) — over the {scopeWord} average,
              the peer average, or both
            </td>
          </tr>
          {investigate.length === 0 ? (
            <tr>
              <td
                colSpan={cols}
                className="px-3 py-2.5 text-[12px] text-content/85"
              >
                Nobody here is over either average.
              </td>
            </tr>
          ) : (
            <Rows list={investigate} />
          )}

          {cleared.length > 0 && (
            <tr>
              <td colSpan={cols} className="p-0">
                {/* The tail. "Over either average" is a loose rule and most of
                    what it catches is ordinary — they stay reachable and stay
                    out of the way. */}
                <button
                  onClick={onToggleQuiet}
                  className={`w-full text-left hover:bg-gray-100 transition-colors ${sectionHead}`}
                >
                  Not flagged ({cleared.length}) at or below both averages{" "}
                  {showQuiet ? "▾" : "▸"}
                </button>
              </td>
            </tr>
          )}
          {showQuiet && <Rows list={cleared} />}
        </tbody>
      </table>
    </div>
  );
};

export default LpWhoList;
