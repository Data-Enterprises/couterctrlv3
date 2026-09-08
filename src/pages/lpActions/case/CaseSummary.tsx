import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";
import type { LpVerdict } from "./caseVerdict";

/**
 * The whole case in prose, before any chart.
 *
 * It opens with a NAMED PATTERN, not a grade. "Critical, 3.4× the peer
 * average" tells a manager the number is big and nothing else — not what
 * happened, not what to look at, not whether it is even about the cashier.
 * "Bulk basket — 80 cancelled lines across 2 receipts, about 40 per basket"
 * is the same data saying something a person can act on.
 *
 * The evidence sentence leads, because it is the finding. The old headline
 * ("Cancelled — new this week") restated the tab the reader had just clicked
 * and has been dropped rather than kept alongside.
 *
 * The findings below are a ruled list with a mark naming what kind of look
 * each one is asking for. Icons in a column read as decoration, which is what
 * they were.
 */
export type EvidenceIcon = "clock" | "store" | "items";

export interface EvidenceLine {
  icon: EvidenceIcon;
  text: string;
}

interface Props {
  verdict: LpVerdict;
  finding: string;
  lines: EvidenceLine[];
  caution: string;
}

/** What kind of look each finding is asking for. A short uppercase word, not
 *  a picture. */
const MARK: Record<EvidenceIcon, string> = {
  clock: "When",
  store: "Store",
  items: "Items",
};

/**
 * The finding, open.
 *
 * This was the app's collapsed insight strip, and that was the wrong control
 * for it. A strip is right when the title is the answer and the body is
 * optional detail — a sub-department down 9% needs no sentence to be
 * understood. Here the title is "Bulk basket" and the ANSWER is the sentence
 * under it: eighty lines across two receipts, about forty a basket, pull those
 * receipts. Hiding that behind a chevron meant the one thing on the page worth
 * reading needed a click to find, and every screenshot of this panel came back
 * looking like it said nothing.
 *
 * So the verdict is a block, not a strip: tag, sentence, always visible. The
 * qualification rides directly under it, because a claim and its
 * qualification separated by anything is a claim nobody reads the
 * qualification of.
 */
const SKIN: Record<LpVerdict["tone"], string> = {
  hot: "bg-severity_critical_bg border-severity_critical_text/25 text-severity_critical_text",
  mid: "bg-severity_watch_bg border-severity_watch_text/30 text-severity_watch_text",
  calm: "bg-gray-100 border-gray-300 text-content",
};

const CaseSummary = ({ verdict, finding, lines, caution }: Props) => (
  <>
    <div className={`border-b px-4 py-3 ${SKIN[verdict.tone]}`}>
      <div className="flex items-baseline gap-2 mb-1.5">
        <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0 translate-y-0.5" />
        <span className="text-[12px] font-bold uppercase tracking-[0.11em]">
          {verdict.label}
        </span>
      </div>
      <p className="m-0 text-[14px] leading-relaxed text-content max-w-[74ch]">
        {verdict.evidence}
      </p>
      <p className="m-0 mt-2 text-[13px] leading-relaxed text-content/85 max-w-[74ch]">
        {finding} <span className="font-semibold">What would undo it:</span>{" "}
        {caution}
      </p>
    </div>

    {lines.length > 0 && (
      <div className="border-b border-[#1e2a4a]/15">
        {lines.map((l) => (
          <div
            key={l.text}
            className="px-4 py-2.5 border-b border-[#1e2a4a]/15 last:border-b-0 grid grid-cols-[58px_1fr] gap-3 items-start"
          >
            <span className="rounded px-1 py-1 text-center bg-gray-100 text-content/85 text-[10px] font-bold uppercase tracking-wide">
              {MARK[l.icon]}
            </span>
            <p className="m-0 text-[13px] leading-relaxed text-content max-w-[68ch]">
              {l.text}
            </p>
          </div>
        ))}
      </div>
    )}
  </>
);

export default CaseSummary;
