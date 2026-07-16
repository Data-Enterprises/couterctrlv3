import { calculateCogs } from "../..";
import type { SubDeptGrade, MarginTier } from "../../../../features/subMarginSlice";
import SevBadge from "../../../sales/mobile/components/SevBadge";

const fmt1 = (n: number) => n.toFixed(1);
const fmtPts = (n: number) => `${n >= 0 ? "+" : ""}${fmt1(n)} pts`;

interface Props {
  desc: string;
  grade: SubDeptGrade | undefined;
  tier: MarginTier;
  onClick: () => void;
}

const SubDeptRowMobile = ({ desc, grade, tier, onClick }: Props) => {
  if (!grade) {
    return (
      <div className="px-3 py-3 border-b border-gray-300 flex items-center gap-3 bg-custom-white">
        <div className="w-[22px] h-[22px] rounded-[6px] bg-gray-100 animate-pulse flex-shrink-0" />
        <div className="flex-1">
          <div className="text-[12px] font-medium text-content">{desc}</div>
          <div className="text-[10px] text-content/85 mt-0.5">Grading…</div>
        </div>
      </div>
    );
  }

  // Build 7-day mini strip: green/red vs LY margin
  const tyDates = [...new Set(grade.tyWeekOneMargins.map((m) => m.sale_date))].sort();
  const lyDates = [...new Set(grade.lyWeekOneMargins.map((m) => m.sale_date))].sort();

  const dayStrip = tyDates.map((date, i) => {
    const tyDay = grade.tyWeekOneMargins.filter((m) => m.sale_date === date);
    const lyDay = lyDates[i] ? grade.lyWeekOneMargins.filter((m) => m.sale_date === lyDates[i]) : [];

    const tyNet = tyDay.reduce((s, m) => s + (m.total_sales - m.total_tax), 0);
    const tyCogs = tyDay.reduce((s, m) => s + calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight), 0);
    const lyNet = lyDay.reduce((s, m) => s + (m.total_sales - m.total_tax), 0);
    const lyCogs = lyDay.reduce((s, m) => s + calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight), 0);
    const tyM = tyNet > 0 ? ((tyNet - tyCogs) / tyNet) * 100 : 0;
    const lyM = lyNet > 0 ? ((lyNet - lyCogs) / lyNet) * 100 : 0;
    const label = new Date(date.split("T")[0] + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1);
    const hasRef = lyNet > 0;

    return { label, isUp: tyM >= lyM, hasRef };
  });

  return (
    <button
      onClick={onClick}
      className="flex items-start w-full px-3 py-3 gap-3 bg-custom-white border-b border-gray-300 last:border-0 text-left active:bg-gray-50"
    >
      <SevBadge sev={tier} />
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium text-content truncate mb-1.5">{desc}</div>
        <div className="grid grid-cols-3 mb-1.5">
          <div className="px-1.5 py-1">
            <div className="text-[10px] text-content/85 uppercase tracking-wide">TY</div>
            <div className="text-[11px] font-medium text-content mt-0.5">{fmt1(grade.tyMarginPct)}%</div>
            <div className="text-[10px] text-content/85 mt-0.5">—</div>
          </div>
          <div className="px-1.5 py-1">
            <div className="text-[10px] text-content/85 uppercase tracking-wide">LW</div>
            <div className="text-[11px] font-medium text-content mt-0.5">
              {grade.lwSales > 0 ? `${fmt1(grade.lwMarginPct)}%` : "—"}
            </div>
            {grade.lwSales > 0 && (
              <div className={`text-[10px] font-medium mt-0.5 ${grade.lwPtsDelta >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {fmtPts(grade.lwPtsDelta)}
              </div>
            )}
          </div>
          <div className="px-1.5 py-1">
            <div className="text-[10px] text-content/85 uppercase tracking-wide">LY</div>
            <div className="text-[11px] font-medium text-content mt-0.5">
              {grade.lySales > 0 ? `${fmt1(grade.lyMarginPct)}%` : "—"}
            </div>
            {grade.lySales > 0 && (
              <div className={`text-[10px] font-medium mt-0.5 ${grade.ptsDelta >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {fmtPts(grade.ptsDelta)}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-0.5">
          {dayStrip.map(({ label, isUp, hasRef }, idx) => (
            <div
              key={idx}
              className={`w-6 h-[18px] rounded text-[10px] font-bold flex items-center justify-center ${
                !hasRef ? "bg-gray-200 text-gray-400" : isUp ? "bg-emerald-400 text-custom-white" : "bg-red-400 text-custom-white"
              }`}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </button>
  );
};

export default SubDeptRowMobile;
