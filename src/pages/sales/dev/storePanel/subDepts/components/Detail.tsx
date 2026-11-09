// Hooks
import { useState } from "react";

// Utils
import {
  CTA_SEVERITY_CLASSES,
  type Severity,
} from "../../../../../../utils/severity";
import { money, signed, whole } from "../utils";

// Interfaces
import type { ReportRow } from "../../../utils/deptReport";

// Components
import {
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/20/solid";
import Block from "./Block";
import Measure from "./Measure";
import Tile from "./Tile";

/* The panel                                                           */
/**
 * The selected department, in full.
 *
 * What the single column could never fit: the sentence, the three gates
 * with a column each, the exact split behind the sentence, and how the
 * same subtraction ran in the two earlier weeks.
 */
const Detail = ({
  row,
  us,
  them,
  day: picked,
  onInvestigate,
}: {
  row: ReportRow;
  /** Full store names: a number is what the row is keyed by, not what
   *  anybody calls it. */
  us: string;
  them: string;
  /** The day picked in the strip, or null for the week. The figures are
   *  that day's, so the headings have to say so. */
  day: string | null;
  onInvestigate: (row: ReportRow) => void;
}) => {
  const ahead = row.gap >= 0;
  /* Closed. It lays over the panel rather than pushing it down, so an open
     strip on arrival would cover the first thing the panel has to show. */
  const [open, setOpen] = useState(false);
  const oneWord = row.weighed ? "lb" : "unit";

  /* The identity behind the sentence: the gap is exactly what the missing
     units would have taken at THEIR rate, plus what our own units lost at
     our rate. One bar, because they are two halves of one figure. */
  const split = row.split;
  const splitSize = split ? Math.abs(split.volume) + Math.abs(split.rate) : 0;

  /** Wider or narrower, not bigger or smaller: a gap is a distance. */
  const againstWeek = (when: string, then: number) => {
    const move = Math.abs(row.gap) - Math.abs(then);
    if (Math.abs(move) < 0.005) return `the same as ${when}`;
    return (
      <>
        <span
          className={`font-semibold ${
            move > 0 ? "text-delta_negative_text" : "text-delta_positive_text"
          }`}
        >
          {money(Math.abs(move))} {move > 0 ? "wider" : "narrower"}
        </span>{" "}
        than {when}
      </>
    );
  };

  /**
   * Critical where a gate actually failed, watch where none did and it is
   * merely down, healthy where it is ahead.
   *
   * "A little less of everything" passed all three checks — calling that
   * critical beside a department that rang nothing would make the strongest
   * colour on the page mean "behind by any amount", which is what the gap
   * figure beside it already says.
   */
  const sev: Severity = ahead
    ? "healthy"
    : row.chain.finding === "a-little-less" || row.chain.finding === "level"
      ? "watch"
      : "critical";
  const cta = CTA_SEVERITY_CLASSES[sev];
  const Mark_ =
    sev === "critical"
      ? ExclamationTriangleIcon
      : sev === "watch"
        ? ExclamationCircleIcon
        : CheckCircleIcon;

  return (
    <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
      {/* The same strip the single-store tab opens a department with: the
          name, what it is worth, and the finding folded behind it. */}
      <div className={`relative flex-shrink-0 border-b ${cta.border}`}>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`w-full flex items-center gap-2 px-4 py-2 text-left transition-colors ${cta.bg} ${cta.hoverBg}`}
        >
          <Mark_ className={`w-4 h-4 flex-shrink-0 ${cta.text}`} />
          {/* The name alone. The gap is the first tile under this strip,
              and twice on one screen is once too many. */}
          <span
            className={`min-w-0 flex-1 truncate text-[14px] font-semibold ${cta.text}`}
          >
            {row.name}
          </span>
          {open ? (
            <ChevronUpIcon
              className={`w-3.5 h-3.5 flex-shrink-0 ${cta.text}`}
            />
          ) : (
            <ChevronDownIcon
              className={`w-3.5 h-3.5 flex-shrink-0 ${cta.text}`}
            />
          )}
        </button>

        {/* Over the panel, not above it. Pushing the blocks down meant
            every open and close moved the whole column, and the reader lost
            their place in the thing the strip is describing. */}
        {open && (
          <div
            className={`absolute top-full left-0 right-0 z-20 px-4 py-2.5 border-b shadow-lg ${cta.bg} ${cta.border}`}
          >
            <p className={`text-[12.5px] leading-snug ${cta.text}`}>
              <span className="font-bold">{row.chain.says.lead}</span>
              {row.chain.says.tail}
            </p>

            {/* The two halves the gap is exactly the sum of. Each is
                coloured by what it DID to the gap rather than by the
                department's own direction: a term that runs the other way
                is closing the gap, not composing it, and painting it the
                same red as the term that opened it said the opposite. */}
            {split && splitSize > 0 && (
              <>
                <span className="flex h-[8.4px] rounded-sm overflow-hidden bg-custom-white/60 mt-2">
                  <span
                    className={`block ${split.volume < 0 ? "bg-red-500" : "bg-emerald-500"}`}
                    style={{
                      width: `${(Math.abs(split.volume) / splitSize) * 100}%`,
                    }}
                  />
                  <span
                    className={`block ${split.rate < 0 ? "bg-red-500" : "bg-emerald-500"}`}
                    style={{
                      width: `${(Math.abs(split.rate) / splitSize) * 100}%`,
                    }}
                  />
                </span>
                <div
                  className={`flex justify-between gap-4 text-[11.5px] mt-1 ${cta.text}`}
                >
                  <span>
                    {row.weighed ? "Weight" : "Units"}{" "}
                    <span className="font-bold tabular-nums">
                      {signed(split.volume)}
                    </span>
                  </span>
                  <span>
                    Take per {oneWord}{" "}
                    <span className="font-bold tabular-nums">
                      {signed(split.rate)}
                    </span>
                  </span>
                </div>
              </>
            )}

            {/* And how it compares with itself. A gap that has always been
                there is a different job from one that opened this week, and
                it belongs with the rest of what is true of the gap rather
                than in a card of its own beside the stores. */}
            <p className={`text-[11.5px] mt-2 ${cta.text}`}>
              {againstWeek(
                picked ? "the same day last week" : "last week",
                row.lwGap,
              )}{" "}
              &middot;{" "}
              {againstWeek(
                picked ? "the same day last year" : "last year",
                row.lyGap,
              )}
            </p>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-auto thin-scrollbar px-4 py-3 flex flex-col">
        {/* Three checks in order, and the first one to fail is the finding.
          A green tick says only that this check was not the problem — a
          department can pass "rung" by ringing anything at all and still be
          five thousand down, which is exactly what the row's own red is
          about. The heading is here so the two colours are plainly
          answering different questions. */}
        <Block
          title="Where it breaks down"
          action={
            /* At the top, beside the first thing the panel says. Pinned to the
             bottom it sat under four cards, which on a short panel is fine
             and on a long one is a scroll away from every reason to press
             it. The chain's own wording survives as the title: the button
             is one word, and hovering says which way it is pointing. */
            <button
              onClick={() => onInvestigate(row)}
              title={row.chain.cta}
              className="px-3 py-1.5 rounded-md bg-brand_navy hover:bg-brand_navy_hover text-custom-white text-[12px] font-bold transition-colors whitespace-nowrap"
            >
              Investigate
            </button>
          }
        >
          <div className="grid grid-cols-3 gap-2.5">
            {row.chain.gates.map((g) => (
              <Tile key={g.name} gate={g} />
            ))}
          </div>
        </Block>

        <Block
          title={`${
            picked
              ? new Date(picked + "T12:00:00").toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })
              : "This week"
          } against ${them}`}
        >
          <div className="flex flex-col gap-2.5">
            <Measure
              title="Sales"
              mine={row.mine}
              theirs={row.theirs}
              us={us}
              them={them}
              fmt={money}
              better="more"
            />
            <Measure
              title={row.weighed ? "Weight" : "Units"}
              mine={row.mineUnits}
              theirs={row.theirsUnits}
              us={us}
              them={them}
              fmt={whole}
              better="more"
            />
          </div>
        </Block>
      </div>
    </div>
  );
};

export default Detail;
