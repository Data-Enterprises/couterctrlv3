import { useMemo } from "react";
import {
  ArrowRightIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  MinusIcon,
} from "@heroicons/react/16/solid";
import CtaStrip, { type CtaTone } from "../../../../components-dev/CtaStrip";
import { formatBigNumber, formatCurrencyCompact } from "../../../../utils";
import { applyStoreNumberToName } from "../shared/ledgerUtils";
import {
  counterweightOf,
  type ShareRow,
  type ShareStanding,
} from "../shared/shareBalance";
import { shareDayNoteOf, type ShareDay } from "../shared/shareByDay";
import { severityDotClass } from "../../../../utils/severity";

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
    bar: severityDotClass.critical,
    card: "bg-delta_negative_bg",
  },
  consistent: {
    pill: "bg-gray-200 text-content",
    text: "text-content",
    bar: "bg-brand_navy",
    card: "bg-gray-50",
  },
  rising: {
    pill: "bg-delta_positive_bg text-delta_positive_text",
    text: "text-delta_positive_text",
    bar: severityDotClass.healthy,
    card: "bg-delta_positive_bg",
  },
};

/** What the house strip wants, in the delta family: this says which way
 *  share moved, so it is not graded and cannot use CTA_SEVERITY_CLASSES. */
const CTA_TONE: Record<ShareStanding, CtaTone> = {
  falling: {
    border: "border-delta_negative_text/25",
    bg: "bg-delta_negative_bg",
    hoverBg: "hover:bg-delta_negative_text/10",
    text: "text-delta_negative_text",
  },
  consistent: {
    border: "border-gray-200",
    bg: "bg-gray-50",
    hoverBg: "hover:bg-gray-100",
    text: "text-content",
  },
  rising: {
    border: "border-delta_positive_text/25",
    bg: "bg-delta_positive_bg",
    hoverBg: "hover:bg-delta_positive_text/10",
    text: "text-delta_positive_text",
  },
};

/** The strip's icon, by which way share moved — the same slot the Sub dept
 *  and Top 200 strips give their severity icon. */
const CTA_ICON: Record<ShareStanding, typeof ArrowTrendingDownIcon> = {
  falling: ArrowTrendingDownIcon,
  consistent: MinusIcon,
  rising: ArrowTrendingUpIcon,
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
      <aside className="w-[288px] flex-shrink-0 border-l border-gray-100 px-3 pt-2.5">
        <p className="text-[11.5px] text-content/85 leading-snug">
          Pick a store on the left to see what its move was worth, which store
          took the other side of it, and which days of the week it happened on.
        </p>
      </aside>
    );
  }

  // The share bar runs 0 to a bit past whichever of the two slices is
  // bigger: a fixed 0-25% would draw a 7% store as a stub and hide the very
  // gap the panel is about.
  const barCeiling = Math.max(row.sharePct, row.usualPct) * 1.25;
  const barPct = (pct: number) =>
    `${barCeiling > 0 ? Math.min(100, (pct / barCeiling) * 100) : 0}%`;

  // The day chart is in money, around a zero line that IS the usual share.
  const dayMax = Math.max(0, ...days.map((d) => Math.abs(d.money ?? 0)));
  const dayHeight = (m: number) =>
    `${dayMax > 0 ? (Math.abs(m) / dayMax) * 50 : 0}%`;

  const tone = TONE[row.standing];
  const Icon = CTA_ICON[row.standing];
  const name = applyStoreNumberToName(
    row.storeName,
    row.storeNumber,
    row.storeNumbersForId,
  );

  return (
    <aside className="w-[288px] flex-shrink-0 border-l border-gray-100 flex flex-col overflow-y-auto thin-scrollbar">
      {/* The panel's header row IS the strip, the way Sub depts and Top 200
          carry theirs: the name, the word for what it is, a chevron, and the
          working behind it as an overlay. "Selected store" above the name was
          a label for a thing the strip already says. */}
      <CtaStrip
        tone={CTA_TONE[row.standing]}
        icon={
          <Icon
            className={`w-3.5 h-3.5 flex-shrink-0 ${CTA_TONE[row.standing].text}`}
          />
        }
        label={name}
        trailing={LABEL[row.standing]}
        detail={
          <>
            It took <span className="font-bold">{pct1(row.sharePct)}</span> of
            the group this week against the{" "}
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
          </>
        }
      />

      <div className="px-3 pt-2.5 flex flex-col">
        {/* The gap, drawn once. Fill is the slice it took, the pale run
            beside it is the slice it missed (or took on top), and the tick
            is where usual sits. One picture for what was two tiles and a
            sentence. */}
        <div className="flex items-baseline gap-1.5">
          <span className={`text-[22px] font-bold leading-none ${tone.text}`}>
            {signedValue(row.money)}
          </span>
          <span className={`text-[12.5px] font-semibold ${tone.text}`}>
            {signedPct(row.changePct)}
          </span>
        </div>

        <div className="relative h-5 rounded bg-bkg mt-2">
          <span
            className={`absolute left-0 top-0 bottom-0 rounded-l ${tone.bar}`}
            style={{ width: barPct(Math.min(row.sharePct, row.usualPct)) }}
          />
          <span
            className={`absolute top-0 bottom-0 ${tone.bar} opacity-30`}
            style={{
              left: barPct(Math.min(row.sharePct, row.usualPct)),
              width: barPct(Math.abs(row.changePct)),
            }}
          />
          <span
            className="absolute -top-0.5 -bottom-0.5 w-0.5 bg-content"
            style={{ left: barPct(row.usualPct) }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-content/85 tabular-nums mt-0.5">
          <span>{pct1(row.sharePct)} this week</span>
          <span>usually {pct1(row.usualPct)}</span>
        </div>

        {/* The other side of the balance, as two chips rather than a clause.
            Shares total 100%, so this store's move is that one's. */}
        {other && (
          <div className="flex items-center gap-1.5 mt-2.5 text-[11.5px] font-semibold">
            <span
              className={`px-1.5 py-1 rounded whitespace-nowrap ${tone.pill}`}
            >
              {row.storeNumber} {signedValue(row.money)}
            </span>
            <ArrowRightIcon className="w-3 h-3 flex-shrink-0 text-content/85" />
            <span
              className={`px-1.5 py-1 rounded whitespace-nowrap ${TONE[other.standing].pill}`}
            >
              {other.storeNumber} {signedValue(other.money)}
            </span>
          </div>
        )}

        {days.length > 1 && dayMax > 0 && (
          <div className="mt-3">
            <div className="text-[10px] font-bold uppercase tracking-wide text-content/85">
              By day, in {isQty ? "units" : "money"}
            </div>

            {/* Above the line is a day it took more of the group than usual,
                below is a day it took less, and the height is what the day
                was worth. The zero line IS the usual share, so the week's
                shape says what a sentence under it used to. */}
            <div className="relative h-[72px] mt-1.5 flex items-stretch gap-1">
              <span className="absolute left-0 right-0 top-1/2 border-t border-gray-300" />
              {days.map((d) => {
                const worst = note.worst?.date === d.date;
                const m = d.money ?? 0;
                return (
                  <span
                    key={d.date}
                    title={`${d.label}: ${
                      d.sharePct === null ? "no sales" : pct1(d.sharePct)
                    } of the group${
                      d.money === null ? "" : ` · ${signedValue(d.money)}`
                    }`}
                    className="flex-1 relative"
                  >
                    <span
                      className={`absolute left-0 right-0 ${
                        m < 0
                          ? `top-1/2 rounded-b ${TONE.falling.bar}`
                          : `bottom-1/2 rounded-t ${TONE.rising.bar}`
                      } ${worst ? "" : "opacity-70"}`}
                      style={{ height: dayHeight(m) }}
                    />
                  </span>
                );
              })}
            </div>

            <div className="flex gap-1 mt-0.5">
              {days.map((d) => {
                const worst = note.worst?.date === d.date;
                return (
                  <span
                    key={d.date}
                    className={`flex-1 text-center text-[10px] tabular-nums ${
                      worst
                        ? `font-bold ${TONE.falling.text}`
                        : "text-content/85"
                    }`}
                  >
                    {d.label}
                  </span>
                );
              })}
            </div>

            {/* Only the day that cost the most carries a figure. */}
            {note.worst && (
              <div
                className={`text-[11px] font-semibold tabular-nums text-center mt-0.5 ${TONE.falling.text}`}
              >
                {note.worst.label} {signedValue(note.worst.money as number)}
                {note.worstIsBiggestDay && (
                  <span className="text-content/85 font-normal">
                    {" "}
                    · the group&rsquo;s biggest day
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        <button
          onClick={onOpenReport}
          className="mt-3 mb-1 w-full rounded-md bg-brand_navy text-custom-white text-[12px] font-semibold py-2 hover:opacity-90 transition-opacity"
        >
          View store report
        </button>
      </div>
    </aside>
  );
};

export default GroupShareStoreDetail;
