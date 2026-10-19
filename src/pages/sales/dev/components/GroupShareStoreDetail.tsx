import { useMemo } from "react";
import { formatBigNumber, formatCurrencyCompact } from "../../../../utils";
import { applyStoreNumberToName } from "../shared/ledgerUtils";
import {
  counterweightOf,
  type ShareRow,
  type ShareStanding,
} from "../shared/shareBalance";
import { shareDayNoteOf, type ShareDay } from "../shared/shareByDay";

/**
 * One store out of the balance, read on its own.
 *
 * The list beside this says which stores moved and by how much. This says
 * what the move was worth, which store took the other side of it, and which
 * days of the week it happened on — the three things somebody asks next and
 * had to open the store report to find out.
 *
 * Draws only. Every figure is handed to it already worked out, so it cannot
 * disagree with the list beside it.
 */

/** Tone, not grade: which way share moved. The severity family grades a
 *  figure against a threshold, which is a different question. */
const TONE: Record<
  ShareStanding,
  { pill: string; text: string; bar: string; card: string }
> = {
  falling: {
    pill: "bg-delta_negative_bg text-delta_negative_text",
    text: "text-delta_negative_text",
    bar: "bg-delta_negative_text",
    card: "bg-delta_negative_bg",
  },
  consistent: {
    pill: "bg-gray-100 text-content/85",
    text: "text-content",
    bar: "bg-brand_navy",
    card: "bg-gray-50",
  },
  rising: {
    pill: "bg-delta_positive_bg text-delta_positive_text",
    text: "text-delta_positive_text",
    bar: "bg-delta_positive_text",
    card: "bg-delta_positive_bg",
  },
};

const LABEL: Record<ShareStanding, string> = {
  falling: "Falling",
  consistent: "Consistent",
  rising: "Rising",
};

const pct1 = (n: number) => `${n.toFixed(1)}%`;

const signedPct = (n: number) =>
  `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(1)}%`;

interface Props {
  row: ShareRow | null;
  rows: ShareRow[];
  /** The group's week on the same metric, for pricing a share point. */
  groupTotal: number;
  days: ShareDay[];
  isQty: boolean;
  onOpenReport: () => void;
}

const GroupShareStoreDetail = ({
  row,
  rows,
  groupTotal,
  days,
  isQty,
  onOpenReport,
}: Props) => {
  const other = useMemo(
    () => (row ? counterweightOf(row, rows) : null),
    [row, rows],
  );
  const note = useMemo(() => shareDayNoteOf(days), [days]);

  const value = (n: number) =>
    isQty ? formatBigNumber(n, 0) : formatCurrencyCompact(n);
  const signedValue = (n: number) =>
    `${n > 0 ? "+" : n < 0 ? "−" : ""}${value(Math.abs(n))}`;

  if (!row) {
    return (
      <aside className="w-[256px] flex-shrink-0 border-l border-gray-100 pl-3 pt-1">
        <div className="text-[10px] font-bold uppercase tracking-wide text-content/85">
          Selected store
        </div>
        <p className="text-[11.5px] text-content/85 leading-snug mt-2">
          Pick a store on the left to see what its move was worth, which store
          took the other side of it, and which days of the week it happened on.
        </p>
      </aside>
    );
  }

  const tone = TONE[row.standing];
  const name = applyStoreNumberToName(
    row.storeName,
    row.storeNumber,
    row.storeNumbersForId,
  );

  // The bars and the usual line share one scale, so the line reads against
  // every bar rather than only the tall ones.
  const ceiling =
    Math.max(row.usualPct, ...days.map((d) => d.sharePct ?? 0)) * 1.18;
  const heightOf = (pct: number) =>
    `${ceiling > 0 ? Math.min(100, (pct / ceiling) * 100) : 0}%`;

  return (
    <aside className="w-[256px] flex-shrink-0 border-l border-gray-100 pl-3 flex flex-col overflow-y-auto thin-scrollbar">
      <div className="text-[10px] font-bold uppercase tracking-wide text-content/85">
        Selected store
      </div>
      <div className="flex items-center gap-2 mt-0.5 mb-2">
        <span className="text-[12.5px] font-bold text-content truncate">
          {name}
        </span>
        <span
          className={`text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${tone.pill}`}
        >
          {LABEL[row.standing]}
        </span>
      </div>

      {/* What the move was worth, and who is on the other side of it. */}
      <div className={`rounded-md px-2.5 py-2 ${tone.card}`}>
        <p className="text-[11.5px] text-content leading-snug">
          It took <span className="font-bold">{pct1(row.sharePct)}</span> of the
          group this week against the{" "}
          <span className="font-bold">{pct1(row.usualPct)}</span> it usually
          takes. On {value(groupTotal)} that is{" "}
          <span className="font-bold">{signedValue(row.money)}</span>
          {other && (
            <>
              {" "}
              — and {other.storeNumber} went the other way by{" "}
              <span className="font-bold">{signedValue(other.money)}</span>
            </>
          )}
          .
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <div className="rounded-md bg-gray-50 px-2.5 py-2">
          <div className="text-[9.5px] font-bold uppercase tracking-wide text-content/85">
            Share this week
          </div>
          <div className="text-[15px] font-bold text-content tabular-nums">
            {pct1(row.sharePct)}
          </div>
          <div className="text-[10px] text-content/85 tabular-nums">
            usually {pct1(row.usualPct)}
          </div>
        </div>
        <div className={`rounded-md px-2.5 py-2 ${tone.card}`}>
          <div className="text-[9.5px] font-bold uppercase tracking-wide text-content/85">
            Vs usual share
          </div>
          <div className={`text-[15px] font-bold tabular-nums ${tone.text}`}>
            {signedValue(row.money)}
          </div>
          <div className="text-[10px] text-content/85 tabular-nums">
            {signedPct(row.changePct)} of the group
          </div>
        </div>
      </div>

      {days.length > 1 && (
        <div className="mt-3">
          <div className="text-[10px] font-bold uppercase tracking-wide text-content/85">
            Share by day
          </div>
          <div className="text-[10.5px] text-content/85 leading-snug mb-1.5">
            Where the week went, rather than only that it did.
          </div>

          <div className="relative h-[58px] flex items-end gap-1">
            {/* The slice it usually takes, across every day on one scale. A
                bar under this line is a day the store came up light. */}
            <span
              className="absolute left-0 right-0 border-t border-dashed border-content/60 z-10 pointer-events-none"
              style={{ bottom: heightOf(row.usualPct) }}
            />
            {days.map((d) => {
              const under = (d.changePct ?? 0) < 0;
              return (
                <span
                  key={d.date}
                  title={`${d.label}: ${
                    d.sharePct === null ? "no sales" : pct1(d.sharePct)
                  } of the group${
                    d.money === null ? "" : ` · ${signedValue(d.money)}`
                  }`}
                  className="flex-1 relative h-full rounded-t bg-bkg"
                >
                  <span
                    className={`absolute left-0 right-0 bottom-0 rounded-t ${
                      under ? TONE.falling.bar : "bg-brand_navy"
                    }`}
                    style={{ height: heightOf(d.sharePct ?? 0) }}
                  />
                </span>
              );
            })}
          </div>
          <div className="flex gap-1 mt-0.5">
            {days.map((d) => (
              <span
                key={d.date}
                className="flex-1 text-center text-[9.5px] text-content/85"
              >
                {d.label}
              </span>
            ))}
          </div>
          <div className="text-[9.5px] text-content/85 text-right mt-0.5 tabular-nums">
            dashed line: usually {pct1(row.usualPct)}
          </div>

          {note.worst && (
            <p className="text-[11px] text-content/85 leading-snug mt-1.5 rounded-md bg-gray-50 px-2.5 py-2">
              {note.runFrom && note.runFrom.date !== note.worst.date ? (
                <>
                  Under its usual share from {note.runFrom.label} on, worst
                  on{" "}
                </>
              ) : (
                <>Lightest on </>
              )}
              <span className="font-semibold text-content">
                {note.worst.label}
              </span>
              {note.worstIsBiggestDay && " — the group's biggest day"} at{" "}
              <span className="font-semibold text-content">
                {signedValue(note.worst.money as number)}
              </span>
              {note.below > 1 && `, ${note.below} days of the week under usual`}
              .
            </p>
          )}
        </div>
      )}

      <button
        onClick={onOpenReport}
        className="mt-3 mb-1 w-full rounded-md bg-brand_navy text-custom-white text-[12px] font-semibold py-2 hover:opacity-90 transition-opacity"
      >
        View store report
      </button>
    </aside>
  );
};

export default GroupShareStoreDetail;
