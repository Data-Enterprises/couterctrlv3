import { useState } from "react";
import { MagnifyingGlassIcon, QuestionMarkCircleIcon } from "@heroicons/react/16/solid";
import { useAppDispatch } from "../../../../hooks";
import { useSubMarginCtx } from "../../hooks";
import { useSubMarginActions } from "../../hooks/useSubMarginActions";
import { formatCurrency2 } from "../../../../utils";
import { gpm } from "../../../../functions";
import { calculateCogs } from "../..";
import { formatDate } from "../widgets";
import { setDates } from "../..";
import SmDevWeekList from "./SmDevWeekList";
import SelectFilter from "../../../../components/filters/SelectFilter";

interface Props {
  onSearchOpen: () => void;
}

const SmDevLeftColumn = ({ onSearchOpen }: Props) => {
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();
  const [legendHover, setLegendHover] = useState(false);
  const hasSubDept = ctx.selectedSubDeptId > 0;

  const storeName =
    ctx.assignedStores.find((s) => s.storeid === ctx.searchValue)?.store_name ?? "";
  const subDeptName =
    ctx.subDepts.find((s) => s.id === ctx.selectedSubDeptId)?.desc ?? "";

  const periodEnd = ctx.singleDate
    ? formatDate(setDates(new Date(ctx.singleDate), 0))
    : "";
  const periodStart = ctx.singleDate
    ? formatDate(setDates(new Date(ctx.singleDate), -27))
    : "";
  const dateRange = periodStart && periodEnd ? `${periodStart} – ${periodEnd}` : "";

  const allWeeksData = [
    ...ctx.weekOneMargins,
    ...ctx.weekTwoMargins,
    ...ctx.weekThreeMargins,
    ...ctx.weekFourMargins,
  ];
  const totalSales = allWeeksData.reduce((acc, m) => acc + (m.total_sales - m.total_tax), 0);
  const totalCogs = allWeeksData.reduce(
    (acc, m) => acc + calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight),
    0,
  );
  const totalMargin = gpm(totalSales, totalCogs);
  const hasAllWeeksData = allWeeksData.length > 0;

  const subDeptOptions = ctx.subDepts.map((s) => ({
    label: s.desc,
    value: String(s.id),
  }));

  const handleSubDeptChange = (val: string) => {
    const id = Number(val);
    const subs = [...ctx.subDepts];
    dispatch(actions.requerySubDeptMargins());
    dispatch(actions.setSelectedSubDeptId(id));
    dispatch(actions.setSubDepts(subs));
  };

  return (
    <div
      className="flex flex-col min-w-0 shadow-lg"
      style={{ flexBasis: "28%", flexShrink: 0 }}
    >
      {/* Navy header — 2-row canonical pattern */}
      <div className="bg-[#1e2a4a] rounded-t-xl px-4 pt-1 pb-2.5 flex flex-col gap-0">

        {/* Row 1: title + date range | summary metrics */}
        <div className="flex items-end gap-3 min-h-[26px]">
          <span className="text-white font-medium text-[13px] flex-shrink-0">
            Sub Dept Margins
          </span>
          {dateRange && (
            <span className="text-white/35 text-[11px] flex-shrink-0">{dateRange}</span>
          )}
          <div className="flex-1" />
          {hasAllWeeksData && (
            <>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[10px] text-white/45 uppercase tracking-wide">Net</span>
                <span className="text-[13px] font-medium text-white">
                  {formatCurrency2(totalSales)}
                </span>
              </div>
              <div className="w-px h-4 bg-white/15 flex-shrink-0" />
              <div className="flex items-baseline gap-1.5">
                <span className="text-[10px] text-white/45 uppercase tracking-wide">Margin</span>
                <span className="text-[13px] font-medium text-white">{totalMargin}</span>
              </div>
            </>
          )}
        </div>

        {/* Row 2: search icon + store name | ? icon */}
        <div className="flex items-center gap-2 pt-1.5 mt-1 border-t border-white/[0.08]">
          <button
            className="w-[22px] h-[22px] flex items-center justify-center rounded border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors flex-shrink-0"
            onClick={onSearchOpen}
            title="Search"
          >
            <MagnifyingGlassIcon className="w-3.5 h-3.5" />
          </button>

          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-[11px] font-medium text-white/70 truncate">{storeName}</span>
            {subDeptName && (
              <span className="text-[9px] text-white/40 truncate">{subDeptName}</span>
            )}
          </div>

          <div className="flex-1" />

          <div
            className="relative flex-shrink-0"
            onMouseEnter={() => setLegendHover(true)}
            onMouseLeave={() => setLegendHover(false)}
          >
            <button className="w-[22px] h-[22px] flex items-center justify-center rounded border border-white/20 text-white/50 hover:text-white hover:border-white/40 transition-colors">
              <QuestionMarkCircleIcon className="w-3.5 h-3.5" />
            </button>
            {legendHover && (
              <div
                className="absolute right-0 top-full mt-1.5 z-50 bg-[#1e2a4a] border border-white/15 rounded-lg shadow-lg px-3 py-2.5 flex flex-col gap-1.5"
                style={{ minWidth: 220 }}
              >
                <div className="text-[9px] font-semibold uppercase tracking-wide text-white/35">
                  Metrics
                </div>
                {[
                  { label: "Net Sales", desc: "Total sales minus tax" },
                  { label: "COGS", desc: "Cost of goods sold" },
                  { label: "Margin", desc: "Gross profit margin %" },
                  { label: "Qty", desc: "Units sold" },
                  { label: "Unique Items", desc: "Distinct UPCs in period" },
                ].map(({ label, desc }) => (
                  <div key={label} className="flex items-start gap-2">
                    <span className="text-white/30 text-[10px] mt-px">·</span>
                    <div>
                      <span className="text-[10px] text-white font-medium">{label}</span>
                      <span className="text-[10px] text-white/55"> — {desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub dept filter bar */}
      <div className="px-3 py-2 border-b border-gray-100 bg-gray-50/60 flex items-center gap-2 flex-shrink-0">
        <SelectFilter
          options={subDeptOptions}
          value={ctx.selectedSubDeptId > 0 ? String(ctx.selectedSubDeptId) : ""}
          onChange={handleSubDeptChange}
          placeholder="Select sub department"
          className="flex-1"
        />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-custom-white border-x border-b border-gray-100 rounded-b-xl no-scrollbar">
        {hasSubDept ? (
          <SmDevWeekList />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2 p-6 text-center">
            <p className="text-[12px] text-content/40">Select a sub department above</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default SmDevLeftColumn;
