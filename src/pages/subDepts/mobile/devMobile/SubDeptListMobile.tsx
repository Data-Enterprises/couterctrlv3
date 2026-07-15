import { useState, useRef } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { useSubMarginCtx, useParams } from "../../hooks";
import { useSubMarginActions } from "../../hooks/useSubMarginActions";
import { setGradingThreshold } from "../../../../features/subMarginSlice";
import type { MarginTier } from "../../../../features/subMarginSlice";
import type { SevFilter } from "../../../../features/salesLedgerSlice";
import { fmtDate } from "../../../sales/shared/ledgerUtils";
import ThresholdFilter from "../../../../components/filters/ThresholdFilter";
import SevChips from "../../../sales/mobile/components/SevChips";
import SubDeptRowMobile from "./SubDeptRowMobile";
import type { GradingProgress } from "./SubDeptMarginsMobile";

interface Props {
  onSearch: () => void;
  gradingProgress: GradingProgress;
}

const getTier = (ptsDelta: number, threshold: number): MarginTier => {
  if (ptsDelta < -threshold) return "critical";
  if (ptsDelta < 0) return "watch";
  return "healthy";
};

const TIER_ORDER: Record<MarginTier, number> = { critical: 0, watch: 1, healthy: 2 };

const SubDeptListMobile = ({ onSearch, gradingProgress }: Props) => {
  const dispatch = useAppDispatch();
  const ctx = useSubMarginCtx();
  const params = useParams();
  const actions = useSubMarginActions();
  const [sevFilter, setSevFilter] = useState<SevFilter>("all");

  const subDeptGrades = useAppSelector((s) => s.subMargin.subDeptGrades);
  const loadingGrades = useAppSelector((s) => s.subMargin.loadingGrades);
  const rawGradingThreshold = useAppSelector((s) => s.subMargin.gradingThreshold);

  // Grading should never move sub depts around on its own when the threshold
  // input is cleared — keep grading against the last valid amount so tier
  // placement stays exactly where it was until a new number is typed.
  const gradingThresholdRef = useRef<number>(rawGradingThreshold ?? 9);
  if (rawGradingThreshold != null) gradingThresholdRef.current = rawGradingThreshold;
  const gradingThreshold = gradingThresholdRef.current;

  const store = ctx.assignedStores.find((s) => s.storeid === params.searchValue);
  const storeName = store?.store_name ?? "";

  const weekLabel = `${fmtDate(params.start)} – ${fmtDate(params.end)}, ${new Date(params.end + "T12:00:00").getFullYear()}`;

  const graded = ctx.subDepts.map((sd) => {
    const grade = subDeptGrades[sd.id];
    const tier = grade ? getTier(grade.ptsDelta, gradingThreshold) : ("healthy" as MarginTier);
    return { sd, grade, tier };
  });

  const counts: Record<SevFilter, number> = {
    all: graded.length,
    critical: graded.filter((g) => g.tier === "critical").length,
    watch: graded.filter((g) => g.tier === "watch").length,
    healthy: graded.filter((g) => g.tier === "healthy").length,
  };

  const visible = graded
    .filter((g) => sevFilter === "all" || g.tier === sevFilter)
    .sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]);

  return (
    <div className="flex flex-col h-[calc(100dvh-3rem)] overflow-hidden">
      {/* Navy header */}
      <div className="flex-shrink-0 px-3 pt-2 pb-2.5" style={{ background: "#1e2a4a" }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[13px] font-semibold text-custom-white">{storeName}</div>
            <div className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
              {weekLabel}
            </div>
          </div>
          <button
            onClick={onSearch}
            className="w-[30px] h-[30px] flex items-center justify-center rounded border border-white/20 text-custom-white/85 hover:text-custom-white hover:border-white/40 transition-colors flex-shrink-0 mt-0.5"
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Legend + threshold */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-[7px] h-[7px] rounded-[2px] bg-red-200 flex-shrink-0" />
              <span className="text-custom-white/85 text-[9px]">Critical &gt;{gradingThreshold} pts</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-[7px] h-[7px] rounded-[2px] bg-amber-200 flex-shrink-0" />
              <span className="text-custom-white/85 text-[9px]">Watch ≤{gradingThreshold} pts</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-[7px] h-[7px] rounded-[2px] bg-emerald-200 flex-shrink-0" />
              <span className="text-custom-white/85 text-[9px]">Healthy</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-[9px] text-custom-white/85">Threshold</span>
            <ThresholdFilter
              value={rawGradingThreshold === null ? null : { op: "gt", amount: rawGradingThreshold }}
              onChange={(v) => dispatch(setGradingThreshold(v?.amount ?? null))}
              suffix="pts"
              showOp={false}
              showClear={false}
              inputWidth={40}
              variant="dark"
            />
          </div>
        </div>
      </div>

      {/* Grading progress */}
      {loadingGrades && gradingProgress.total > 0 && (
        <div className="flex-shrink-0 bg-amber-50 border-b border-amber-200 px-3 py-1.5 text-[11px] text-amber-800">
          Grading {gradingProgress.completed} / {gradingProgress.total}…
        </div>
      )}

      <SevChips active={sevFilter} counts={counts} onChange={setSevFilter} />

      <div className="flex-1 overflow-y-auto">
        {visible.map(({ sd, grade, tier }) => (
          <SubDeptRowMobile
            key={sd.id}
            desc={sd.desc}
            grade={grade}
            tier={tier}
            onClick={() => dispatch(actions.setSelectedSubDeptId(sd.id))}
          />
        ))}
      </div>
    </div>
  );
};

export default SubDeptListMobile;
