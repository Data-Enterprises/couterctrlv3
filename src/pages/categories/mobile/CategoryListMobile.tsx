import { useMemo, useRef, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import {
  setThreshold,
  setSelectedCategory,
  CATEGORY_THRESHOLD_DEFAULT,
} from "../../../features/categoriesSlice";
import type { SevFilter } from "../../../features/salesLedgerSlice";
import ThresholdFilter from "../../../components/filters/ThresholdFilter";
import SevChips from "../../../components/SevChips";
import { fmtRangeLabel } from "../../../utils/dateLabels";
import { getTier, sortGraded } from "../categoriesUtils";
import CategoryRowMobile from "./CategoryRowMobile";

/**
 * The graded category list — the mobile equivalent of `CategoryListPanel`.
 *
 * Header, legend, threshold and chips follow Sub Dept Margins, which is the
 * canonical layout. No metric toggle: it stays a desktop control, and mobile
 * renders whatever `metric` is already set.
 */

/** The chip row's own filter. Wider than `SevFilter` because a category with
 *  neither last week nor last year can't be graded — folding those into
 *  "healthy" would claim a pass nothing measured. */
type CategoryFilter = SevFilter | "ungraded";

const CategoryListMobile = ({ onSearch }: { onSearch: () => void }) => {
  const dispatch = useAppDispatch();
  const { rows, metric, threshold, storeName, twStart, twEnd } = useAppSelector(
    (s) => s.categories,
  );
  const [sevFilter, setSevFilter] = useState<CategoryFilter>("all");

  // Grading should never move categories around on its own while the threshold
  // input sits empty mid-edit — keep grading against the last valid number so
  // tier placement holds until a new one is typed.
  const thresholdRef = useRef<number>(threshold ?? CATEGORY_THRESHOLD_DEFAULT);
  if (threshold != null) thresholdRef.current = threshold;
  const activeThreshold = thresholdRef.current;

  const graded = useMemo(
    () =>
      rows.map((row) => ({
        ...row,
        tier: getTier(row, activeThreshold, metric),
      })),
    [rows, activeThreshold, metric],
  );

  const counts: Record<SevFilter, number> = {
    all: graded.length,
    critical: graded.filter((g) => g.tier === "critical").length,
    watch: graded.filter((g) => g.tier === "watch").length,
    healthy: graded.filter((g) => g.tier === "healthy").length,
  };
  const ungradedCount = graded.filter((g) => g.tier === "ungraded").length;

  // `sortGraded` is the page's own ordering — critical first, then by size
  // within a tier — reused rather than re-implemented so the two layouts can't
  // disagree about what "worst first" means.
  const visible = sortGraded(
    graded.filter((g) => sevFilter === "all" || g.tier === sevFilter),
    metric,
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-3rem)] bg-gray-50 overflow-hidden">
      <div
        className="flex-shrink-0 px-3 pt-2 pb-2.5"
        style={{ background: "#1e2a4a" }}
      >
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-custom-white truncate">
              {storeName}
            </div>
            <div className="text-[11px] mt-0.5 text-custom-white/85">
              {fmtRangeLabel(twStart, twEnd)}
            </div>
          </div>
          <button
            onClick={onSearch}
            aria-label="New search"
            className="w-[30px] h-[30px] flex items-center justify-center rounded border border-custom-white/20 text-custom-white/85 hover:text-custom-white hover:border-custom-white/40 transition-colors flex-shrink-0 mt-0.5"
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-[7px] h-[7px] rounded-[2px] bg-red-200 flex-shrink-0" />
              <span className="text-custom-white/85 text-[10px]">
                Critical &gt;{activeThreshold}%
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-[7px] h-[7px] rounded-[2px] bg-amber-200 flex-shrink-0" />
              <span className="text-custom-white/85 text-[10px]">
                Watch ≤{activeThreshold}%
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-[7px] h-[7px] rounded-[2px] bg-emerald-200 flex-shrink-0" />
              <span className="text-custom-white/85 text-[10px]">Healthy</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[10px] text-custom-white/85">Threshold</span>
            <ThresholdFilter
              value={
                threshold === null ? null : { op: "gt", amount: threshold }
              }
              onChange={(v) => dispatch(setThreshold(v?.amount ?? null))}
              suffix="%"
              showOp={false}
              showClear={false}
              inputWidth={40}
              variant="dark"
            />
          </div>
        </div>
      </div>

      <SevChips
        active={sevFilter}
        counts={counts}
        onChange={setSevFilter}
        extra={{
          label: "Ungraded",
          count: ungradedCount,
          active: sevFilter === "ungraded",
          onClick: () =>
            setSevFilter((f) => (f === "ungraded" ? "all" : "ungraded")),
        }}
      />

      {/* pb-14 clears the fixed bottom tab bar, which is outside document flow
          and would otherwise hide the last row. */}
      <div className="flex-1 overflow-y-auto pb-14">
        {visible.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-[12px] text-content/85">
            No categories match filter
          </div>
        ) : (
          visible.map((row) => (
            <CategoryRowMobile
              key={row.category}
              row={row}
              tier={row.tier}
              metric={metric}
              onClick={() => dispatch(setSelectedCategory(row.category))}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CategoryListMobile;
