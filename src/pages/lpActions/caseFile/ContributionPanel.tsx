import { useState } from "react";
import { hueFor } from "../typeColour";
import ContributionSentence from "./ContributionSentence";
import ContributionTooltip from "./ContributionTooltip";
import type { ContributionView } from "./contributionModel";
import type { CaseFile } from "./caseFileModel";

/**
 * The multiple, taken apart.
 *
 * The table beside this says every type is above baseline; this says which one
 * is carrying the gap. Two types can both read "up" while one accounts for two
 * thirds of the excess and the other for a tenth, and only the share tells
 * them apart — which is the difference between a case with a thread to pull
 * and a case that is merely noisy.
 *
 * Bars are EXCESS EVENTS, not counts. A type with a large count and a large
 * baseline contributes nothing to a multiple, and drawing it at full length
 * beside a type that genuinely moved would say the opposite of the truth.
 *
 * A type below its own baseline draws no bar. It is offsetting rather than
 * contributing, and a same-direction bar for a negative reads as a positive at
 * a glance — the figure carries it instead.
 *
 * No title bar. What the bars measure is what the hover says, and a heading
 * plus a subheading plus a hint above four rows was more chrome than content.
 *
 * The sentence behind each row is a hover, not a paragraph. Printed under the
 * chart it explained the leading row and only the leading row, permanently, to
 * a reader who had already read it; on hover every row can explain itself and
 * none of them costs height. The leading one is also in the summary strip's
 * popover, which is where this page keeps its explanations.
 */
interface Props {
  file: CaseFile;
  view: ContributionView;
}

const ContributionPanel = ({ file, view }: Props) => {
  const { headline } = file;
  const [hover, setHover] = useState<{ key: string; rect: DOMRect } | null>(
    null,
  );

  const peak = Math.max(...view.rows.map((r) => Math.max(r.excess, 0)), 0.001);
  const hovered = view.rows.find((r) => r.saleType === hover?.key) ?? null;

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden flex flex-col">
      {/* Says what the rows are rather than labelling their columns: "TYPE"
          above a list of type names, and "# | %" above two figures that
          already read as a count and a percentage, were labels doing no work.
          Same ground, padding and type as the grid's header, so the first
          exception on this side sits level with the first on that side. */}
      <div className="px-3 py-2 bg-gray-100 border-b border-gray-100 text-[12px] font-semibold uppercase tracking-wide text-content/85">
        Events above their own baseline
      </div>

      <div className="flex-1 px-3 py-2.5 flex flex-col gap-2">
        {view.rows.map((row) => (
          <div
            key={row.saleType}
            onMouseEnter={(e) =>
              setHover({
                key: row.saleType,
                rect: e.currentTarget.getBoundingClientRect(),
              })
            }
            onMouseLeave={() => setHover(null)}
            className="flex items-center gap-2.5 rounded px-1 -mx-1 py-0.5 hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-1.5 w-[92px] flex-shrink-0 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ background: hueFor(row.saleType) }}
              />
              <span className="text-[13px] text-content truncate">
                {row.saleType}
              </span>
            </span>

            <span className="flex-1 min-w-0 h-3 flex items-center">
              {row.excess > 0 && (
                <span
                  className="h-3 rounded-sm"
                  style={{
                    width: `${(row.excess / peak) * 100}%`,
                    background: hueFor(row.saleType),
                  }}
                />
              )}
            </span>

            {/* Inline, not stacked: two figures about one row read as one
                reading, and stacking them made every row two lines tall for a
                number four characters wide. */}
            <span className="flex items-baseline justify-end gap-1.5 w-[92px] flex-shrink-0">
              <span className="text-[13px] font-semibold text-content">
                {row.excess > 0 ? "+" : ""}
                {row.excess.toFixed(1)}
              </span>
              <span className="text-[12px] text-content/85">|</span>
              <span className="text-[12px] text-content/85">
                {Math.round(row.share * 100)}%
              </span>
            </span>
          </div>
        ))}
      </div>

      {hover && hovered && (
        <ContributionTooltip anchor={hover.rect}>
          <ContributionSentence
            row={hovered}
            view={view}
            cashierName={headline.cashierName}
            lead={view.lead?.saleType === hovered.saleType}
          />
        </ContributionTooltip>
      )}
    </div>
  );
};

export default ContributionPanel;
