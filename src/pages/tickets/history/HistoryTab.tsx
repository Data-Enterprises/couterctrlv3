import { useMemo } from "react";
import { useTicketsCtx } from "../hooks";
import SelectFilter from "../../../components/filters/SelectFilter";
import { setHistoryCompanyFilter } from "../ticketsSlice";
import type { Ticket } from "../interfaces";
import { MOCK_COMPANIES } from "../mockData";

interface HistoryTabProps {
  isElevated: boolean;
}

const PRIORITY_STYLES: Record<Ticket["priority"], string> = {
  low: "bg-gray-100 text-content",
  normal: "bg-amber-50 text-amber-800",
  high: "bg-red-50 text-red-800",
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const formatDuration = (openedIso: string, closedIso: string) => {
  const hrs = (new Date(closedIso).getTime() - new Date(openedIso).getTime()) / 3_600_000;
  if (hrs < 24) return `${hrs.toFixed(1)}h`;
  return `${(hrs / 24).toFixed(1)}d`;
};

const HistoryTab = ({ isElevated }: HistoryTabProps) => {
  const ctx = useTicketsCtx();

  const closed = useMemo(() => {
    const inScope = isElevated
      ? ctx.tickets
      : ctx.tickets.filter((t) =>
          ctx.companies.some((c) => c.company === t.company),
        );
    const closedOnly = inScope.filter((t) => t.status === "closed" && t.closed_at);
    if (isElevated && ctx.historyCompanyFilter) {
      return closedOnly.filter((t) => t.company === ctx.historyCompanyFilter);
    }
    return closedOnly;
  }, [ctx.tickets, ctx.companies, ctx.historyCompanyFilter, isElevated]);

  const kpis = useMemo(() => {
    const avgHrs =
      closed.length === 0
        ? 0
        : closed.reduce(
            (sum, t) => sum + (new Date(t.closed_at!).getTime() - new Date(t.created_at).getTime()) / 3_600_000,
            0,
          ) / closed.length;
    const highPriority = closed.filter((t) => t.priority === "high").length;
    const byCompany = new Map<string, number>();
    closed.forEach((t) => byCompany.set(t.company_name, (byCompany.get(t.company_name) ?? 0) + 1));
    let topCompany = "—";
    let topCount = 0;
    byCompany.forEach((count, name) => {
      if (count > topCount) {
        topCount = count;
        topCompany = name;
      }
    });
    return {
      total: closed.length,
      avgResolution: avgHrs < 24 ? `${avgHrs.toFixed(1)}h` : `${(avgHrs / 24).toFixed(1)}d`,
      highPriority,
      topCompany,
    };
  }, [closed]);

  return (
    <div className="flex-1 flex flex-col min-h-0 p-4">
      <div className="bg-gray-50 rounded-lg p-3 mb-4 flex-shrink-0">
        {isElevated && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10.5px] text-content/85">Company:</span>
            <SelectFilter
              options={MOCK_COMPANIES.map((c) => ({ value: String(c.id), label: c.name }))}
              value={ctx.historyCompanyFilter === "" ? "" : String(ctx.historyCompanyFilter)}
              onChange={(v) => ctx.dispatch(setHistoryCompanyFilter(v ? Number(v) : ""))}
              placeholder="Any company"
              className="w-[150px]"
            />
          </div>
        )}

        <div className="grid grid-cols-4 gap-2.5">
          <div className="bg-custom-white border border-gray-100 rounded-lg px-3 py-2.5">
            <div className="text-[10.5px] text-content/85">Closed</div>
            <div className="text-[20px] font-medium text-content mt-0.5">{kpis.total}</div>
          </div>
          <div className="bg-custom-white border border-gray-100 rounded-lg px-3 py-2.5">
            <div className="text-[10.5px] text-content/85">Avg resolution</div>
            <div className="text-[20px] font-medium text-content mt-0.5">{kpis.avgResolution}</div>
          </div>
          <div className="bg-custom-white border border-gray-100 rounded-lg px-3 py-2.5">
            <div className="text-[10.5px] text-content/85">High priority</div>
            <div className="text-[20px] font-medium text-content mt-0.5">{kpis.highPriority}</div>
          </div>
          <div className="bg-custom-white border border-gray-100 rounded-lg px-3 py-2.5">
            <div className="text-[10.5px] text-content/85">Top company</div>
            <div className="text-[16px] font-medium text-content mt-1 truncate">{kpis.topCompany}</div>
          </div>
        </div>
      </div>

      <div className="border border-gray-100 rounded-lg overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="grid grid-cols-[34%_16%_20%_16%_14%] px-3 py-2 bg-gray-50 text-[9px] font-bold uppercase tracking-wide text-content flex-shrink-0">
          <div>Subject</div>
          <div>Priority</div>
          <div>Assignee</div>
          <div>Closed</div>
          <div>Resolution</div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar divide-y divide-[#1e2a4a]/15">
          {closed.map((t) => {
            const assignee = ctx.staff.find((s) => s.id === t.assignee_id);
            return (
              <div
                key={t.id}
                className="grid grid-cols-[34%_16%_20%_16%_14%] px-3 py-2 text-[12px] items-center text-content even:bg-row_stripe"
              >
                <div className="truncate">{t.subject}</div>
                <div>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${PRIORITY_STYLES[t.priority]}`}
                  >
                    {t.priority}
                  </span>
                </div>
                <div className="truncate">{assignee?.name ?? "Unassigned"}</div>
                <div className="text-content/85">{formatDate(t.closed_at!)}</div>
                <div className="text-content/85">{formatDuration(t.created_at, t.closed_at!)}</div>
              </div>
            );
          })}
          {closed.length === 0 && (
            <div className="flex items-center justify-center py-8 text-[12px] text-content">
              No closed tickets
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryTab;
