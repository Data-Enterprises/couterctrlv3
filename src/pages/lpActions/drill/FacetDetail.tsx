import { formatCurrency2 } from "../../../utils";
import { buildBranches, FACETS } from "./facetModel";
import type { FacetBranch, FacetKey } from "./facetModel";
import type { WeekWindow } from "../lpActionsMetrics";
import type {
  CashierTransaction,
  TransactionListItem,
} from "../../../interfaces";

/**
 * What one branch is made of, read against every other axis.
 *
 * A branch on its own is a count. What makes it a finding is whether it also
 * collapses on the axes the reader did not pick — nine Friday voids that are
 * also one lane and one hour are a shift; nine Friday voids spread across four
 * lanes and the whole trading day are a busy Friday. So the panel re-cuts the
 * selected receipts by the remaining facets and shows how concentrated each
 * one is, rather than making the reader click through all six to find out.
 */
interface Props {
  branch: FacetBranch;
  facet: FacetKey;
  saleType: string;
  rows: CashierTransaction[];
  lines: TransactionListItem[];
  windows: WeekWindow[];
  linesLoading: boolean;
}

const Stat = ({ value, label }: { value: string; label: string }) => (
  <div className="flex-1 min-w-0 px-3 py-1.5 border-r border-gray-100 last:border-r-0">
    <div className="text-[14px] font-semibold tabular-nums text-content leading-tight truncate">
      {value}
    </div>
    <div className="text-[10px] uppercase tracking-wide text-content/85 truncate">
      {label}
    </div>
  </div>
);

const FacetDetail = ({
  branch,
  facet,
  saleType,
  rows,
  lines,
  windows,
  linesLoading,
}: Props) => {
  const ids = new Set(branch.saleIds);
  const scopedRows = rows.filter((r) => ids.has(r.sale_id));
  const scopedLines = lines.filter((l) => ids.has(l.sale_id));

  const others = FACETS.filter((f) => f.key !== facet);

  return (
    <div className="border-b border-gray-100">
      <div className="flex items-stretch border-b border-gray-100 bg-gray-50">
        <Stat value={String(branch.count)} label="occurrences" />
        <Stat value={String(branch.receipts)} label="receipts" />
        <Stat value={formatCurrency2(branch.value)} label="value" />
        <Stat
          value={formatCurrency2(
            branch.receipts ? branch.value / branch.receipts : 0,
          )}
          label="per receipt"
        />
      </div>

      <div className="px-3 py-2">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-content/85 mb-1.5">
          Also concentrated by
        </div>
        <div className="space-y-1">
          {others.map((f) => {
            const branches = buildBranches(
              scopedRows,
              scopedLines,
              windows,
              saleType,
              f.key,
            );
            const total = branches.reduce((acc, b) => acc + b.count, 0);
            const top = branches
              .slice()
              .sort((a, b) => b.count - a.count)
              .slice(0, 3);

            return (
              <div key={f.key} className="flex items-baseline gap-2">
                <span className="text-[11.5px] text-content/85 w-[86px] flex-shrink-0">
                  {f.label}
                </span>
                <span className="text-[12px] text-content min-w-0 flex-1">
                  {top.length === 0 ? (
                    <span className="text-content/85">
                      {f.needsLines && linesLoading
                        ? "reading the receipts…"
                        : `no ${f.noun} data`}
                    </span>
                  ) : (
                    top
                      .map(
                        (b) =>
                          `${b.label} ${Math.round((b.count / Math.max(1, total)) * 100)}%`,
                      )
                      .join(" · ")
                  )}
                </span>
                {top.length > 0 && branches.length === 1 && (
                  <span className="text-[10.5px] px-1.5 py-px rounded-full flex-shrink-0 bg-severity_critical_bg text-severity_critical_text">
                    all one
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FacetDetail;
