import {
  ClockIcon,
  BuildingStorefrontIcon,
  ArchiveBoxIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/20/solid";
import type { CaseType } from "./caseModel";

/**
 * The whole case in prose, before any chart.
 *
 * A verdict, a headline, the numbers behind it, the facts that support it and
 * the reading that would undo it — one block, in that order. A reader who
 * stops here has the case; everything below is the working, there to be
 * checked against this rather than read first.
 *
 * The caution belongs to this block rather than to the evidence: it qualifies
 * the claim, and a claim and its qualification separated by two charts is a
 * claim nobody reads the qualification of.
 */
export type EvidenceIcon = "clock" | "store" | "items";

export interface EvidenceLine {
  icon: EvidenceIcon;
  text: string;
}

interface Props {
  type: CaseType;
  headline: string;
  finding: string;
  lines: EvidenceLine[];
  caution: string;
}

const ICON = {
  clock: ClockIcon,
  store: BuildingStorefrontIcon,
  items: ArchiveBoxIcon,
};

const VERDICT: Record<string, { text: string; tone: string }> = {
  investigate: {
    text: "Investigate",
    tone: "bg-severity_critical_bg text-severity_critical_text",
  },
  watch: {
    text: "Watch",
    tone: "bg-severity_watch_bg text-severity_watch_text",
  },
  steady: {
    text: "Steady",
    tone: "bg-severity_healthy_bg text-severity_healthy_text",
  },
};

const CaseSummary = ({ type, headline, finding, lines, caution }: Props) => {
  const verdict = VERDICT[type.severity] ?? VERDICT.steady;

  return (
    <>
      <div className="px-4 pt-3 pb-2.5">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded flex-shrink-0 ${verdict.tone}`}
          >
            {verdict.text}
          </span>
          <h3 className="text-[15px] font-semibold text-content leading-tight min-w-0 truncate">
            {headline}
          </h3>
        </div>

        <p className="text-[13px] leading-relaxed text-content">{finding}</p>

        {lines.length > 0 && (
          <div className="mt-1.5 space-y-1">
            {lines.map((l) => {
              const Icon = ICON[l.icon];
              return (
                <div key={l.text} className="flex items-baseline gap-2">
                  <Icon className="w-4 h-4 flex-shrink-0 text-content/85 translate-y-0.5" />
                  <span className="text-[13px] leading-relaxed text-content">
                    {l.text}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-4 py-2 bg-severity_watch_bg flex items-baseline gap-2">
        <QuestionMarkCircleIcon className="w-4 h-4 flex-shrink-0 text-severity_watch_text translate-y-0.5" />
        <span className="text-[12.5px] leading-relaxed text-severity_watch_text">
          {caution}
        </span>
      </div>
    </>
  );
};

export default CaseSummary;
