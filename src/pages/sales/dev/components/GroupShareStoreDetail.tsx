import { useMemo, type ReactNode } from "react";
import {
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
import { shareTrendOf, trendPoints } from "../shared/shareQuestions";
import { severityDotClass } from "../../../../utils/severity";

/**
 * One store out of the balance, as the questions it raises.
 *
 * The list beside this says which stores moved and by how much. Restating
 * that here — the share, the usual share, the money again — was the rail's
 * first draft, and it told a reader nothing they had not just clicked on.
 *
 * So this asks what they would ask next. Is it new. When in the week. Which
 * departments. Who took it. Three of the four are answered here from figures
 * the panel already holds; every one of them is a door into the section of
 * the store report that goes further, which is what makes the button at the
 * bottom something other than a dead end.
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

interface Props {
  row: ShareRow | null;
  rows: ShareRow[];
  /** The group's week on the same metric, for pricing a share point. */
  groupTotal: number;
  days: ShareDay[];
  isQty: boolean;
  onOpenReport: () => void;
}

/** A question and its answer. Clicking any of them opens the store report,
 *  which is where the answer goes further. */
const QuestionCard = ({
  question,
  answer,
  sub,
  figure,
  onClick,
}: {
  question: string;
  answer: ReactNode;
  sub: ReactNode;
  figure?: ReactNode;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="w-full text-left rounded-md border border-gray-200 bg-custom-white px-2.5 py-2 hover:bg-gray-50 hover:border-brand_navy/25 transition-colors"
  >
    <div className="text-[12px] text-content/85">{question}</div>
    <div className="flex items-center gap-2 mt-0.5">
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-bold text-content leading-snug">
          {answer}
        </div>
        <div className="text-[12px] text-content/85 leading-snug mt-0.5">
          {sub}
        </div>
      </div>
      {figure && <div className="flex-shrink-0">{figure}</div>}
    </div>
  </button>
);

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
  const trend = useMemo(() => (row ? shareTrendOf(row) : null), [row]);

  const value = (n: number) =>
    isQty ? formatBigNumber(n, 0) : formatCurrencyCompact(n);
  const signedValue = (n: number) =>
    `${n > 0 ? "+" : n < 0 ? "−" : ""}${value(Math.abs(n))}`;

  if (!row || !trend) {
    return (
      <aside className="w-[313px] flex-shrink-0 border-l border-gray-100 px-3 pt-2.5">
        <p className="text-[12.5px] text-content/85 leading-snug">
          Pick a store on the left to see whether its move is new, when in the
          week it happened, and which store took the other side of it.
        </p>
      </aside>
    );
  }

  const tone = TONE[row.standing];
  const Icon = CTA_ICON[row.standing];
  const name = applyStoreNumberToName(
    row.storeName,
    row.storeNumber,
    row.storeNumbersForId,
  );

  const points = trendPoints(trend);
  const fell = row.changePct < 0;

  // The sparkline and the day strip each scale to themselves. A shared scale
  // across three periods of one store would flatten a half-point move, which
  // is the whole size of the finding.
  const trendLo = Math.min(...points.map((p) => p.pct));
  const trendHi = Math.max(...points.map((p) => p.pct));
  const trendY = (pct: number) =>
    trendHi - trendLo < 0.01
      ? 11
      : 20 - ((pct - trendLo) / (trendHi - trendLo)) * 16;

  const dayMax = Math.max(0, ...days.map((d) => Math.abs(d.money ?? 0)));

  return (
    <aside className="w-[313px] flex-shrink-0 border-l border-gray-100 flex flex-col min-h-0">
      {/* The panel's header row IS the strip, the way Sub depts and Top 200
          carry theirs: the name, the word for what it is, a chevron, and the
          working behind it as an overlay. */}
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

      <div className="px-3 pt-2.5 pb-3 flex-1 min-h-0 flex flex-col">
        <div className="flex items-baseline gap-2 flex-shrink-0">
          <span className={`text-[25px] font-bold leading-none ${tone.text}`}>
            {signedValue(row.money)}
          </span>
          <span className="text-[12px] text-content/85">
            vs its usual share
          </span>
        </div>

        <div className="text-[12.5px] font-semibold text-content mt-2 mb-1.5 flex-shrink-0">
          Here&rsquo;s what the report will tell you:
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar space-y-2 pr-0.5">
          {/* Is the slide new, or has it been running? The row cannot say:
              it holds this week against the usual week and nothing in
              between. */}
          <QuestionCard
            question="Is this new?"
            answer={
              trend.lwPct === null ? (
                "No last week to compare"
              ) : trend.running ? (
                <>
                  No &mdash; {fell ? "under" : "over"} its usual share last week
                  too
                </>
              ) : trend.vsLw === "level" ? (
                <>Held level &mdash; {pct1(trend.lwPct)} last week as well</>
              ) : (
                <>
                  Yes &mdash; {trend.vsLw === "down" ? "down" : "up"} from{" "}
                  {pct1(trend.lwPct)} last week
                </>
              )
            }
            sub={
              trend.lyPct === null
                ? "Same week last year: nothing on file"
                : `Same week last year: ${pct1(trend.lyPct)}`
            }
            figure={
              points.length > 1 && (
                <svg viewBox="0 0 56 30" className="w-14 h-[30px]">
                  <polyline
                    points={points
                      .map(
                        (p, i) =>
                          `${6 + i * (44 / (points.length - 1))},${trendY(p.pct)}`,
                      )
                      .join(" ")}
                    fill="none"
                    strokeWidth="1.5"
                    className={`${fell ? "stroke-delta_negative_text" : "stroke-delta_positive_text"}`}
                  />
                  {points.map((p, i) => (
                    <circle
                      key={p.label}
                      cx={6 + i * (44 / (points.length - 1))}
                      cy={trendY(p.pct)}
                      r={i === points.length - 1 ? 2.6 : 1.8}
                      className={`${fell ? "fill-delta_negative_text" : "fill-delta_positive_text"}`}
                    />
                  ))}
                  {points.map((p, i) => (
                    <text
                      key={`t${p.label}`}
                      x={6 + i * (44 / (points.length - 1))}
                      y={29}
                      textAnchor="middle"
                      className="fill-content/70 text-[8px]"
                    >
                      {p.label}
                    </text>
                  ))}
                </svg>
              )
            }
            onClick={onOpenReport}
          />

          {/* Which day of the week it happened on. */}
          <QuestionCard
            question="When did it happen?"
            answer={
              note.worst ? (
                <>
                  Mostly {note.worst.label},{" "}
                  {signedValue(note.worst.money as number)}
                </>
              ) : (
                "Level across the week"
              )
            }
            sub={
              note.worst
                ? [
                    note.worstIsBiggestDay ? "The group's biggest day" : null,
                    note.below > 0
                      ? `${note.below} of ${days.length} days under usual`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : "No single day carries it"
            }
            figure={
              dayMax > 0 && (
                <span className="flex items-end gap-[2px] h-[30px] w-14">
                  {days.map((d) => {
                    const m = d.money ?? 0;
                    return (
                      <span key={d.date} className="flex-1 relative h-full">
                        <span
                          className={`absolute left-0 right-0 ${
                            m < 0
                              ? `top-1/2 rounded-b ${TONE.falling.bar}`
                              : `bottom-1/2 rounded-t ${TONE.rising.bar}`
                          } ${note.worst?.date === d.date ? "" : "opacity-50"}`}
                          style={{ height: `${(Math.abs(m) / dayMax) * 50}%` }}
                        />
                      </span>
                    );
                  })}
                </span>
              )
            }
            onClick={onOpenReport}
          />

          {/* The one question the panel cannot answer from what it holds:
              that would take this store's departments, which is a fetch. The
              card carries the question and no invented answer. */}
          <QuestionCard
            question="Which departments?"
            answer="Open the department breakdown"
            sub="Every sub department, this week against last week and last year"
            onClick={onOpenReport}
          />

          {/* Shares total 100%, so the money went somewhere, and this names
              where. */}
          <QuestionCard
            question="Who picked it up?"
            answer={
              other ? (
                <>
                  Store {other.storeNumber} {signedValue(other.money)}
                </>
              ) : (
                "Nobody moved the other way"
              )
            }
            sub={
              other
                ? `Almost exactly what ${row.storeNumber} ${fell ? "lost" : "gained"}`
                : "Every counted store moved the same way"
            }
            figure={
              other && (
                <span className="flex items-center gap-1 text-[11.5px] font-semibold">
                  <span className={tone.text}>{row.storeNumber}</span>
                  <span className="text-content/85">&rarr;</span>
                  <span className={TONE[other.standing].text}>
                    {other.storeNumber}
                  </span>
                </span>
              )
            }
            onClick={onOpenReport}
          />
        </div>

        <button
          onClick={onOpenReport}
          className="mt-2.5 flex-shrink-0 w-full rounded-md bg-brand_navy text-custom-white text-[12.5px] font-semibold py-2.5 hover:opacity-90 transition-opacity"
        >
          Open the full store report &rarr;
        </button>
      </div>
    </aside>
  );
};

export default GroupShareStoreDetail;
