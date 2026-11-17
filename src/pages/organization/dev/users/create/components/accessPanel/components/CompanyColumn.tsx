// Hooks
import { useOrganizationCtx } from "../../../../../hooks";

// Interfaces
import type { AccessPicks } from "../../../../interfaces";

// Components
import Checkbox from "../../../../../../../../components-dev/Checkbox";

interface CompanyColumnProps {
  picks: AccessPicks;
  activeCompany: number | null;
  companyCounts: Record<number, number>;
  selectCompany: (id: number) => void;
  toggleCompanyPick: (id: number) => void;
}

/**
 * This is the companies section of the access panel with it's logic
 */
const CompanyColumn = ({
  picks,
  selectCompany,
  activeCompany,
  companyCounts,
  toggleCompanyPick,
}: CompanyColumnProps) => {
  const ctx = useOrganizationCtx();

  const companyList = ctx.isProgrammer
    ? ctx.allCompanies.map((c) => ({ id: c.id, name: c.name }))
    : ctx.companies.map((c) => ({ id: c.company, name: c.name }));

  return (
    <div
      className="flex flex-col border-r border-line_hair flex-shrink-0"
      style={{ width: 220 }}
    >
      <div className="px-3 py-2.5 border-b border-line_hair flex-shrink-0">
        <span className="text-[9px] cc-caps-strong">Companies</span>
      </div>
      <div className="flex-1 overflow-y-auto thin-scrollbar divide-y divide-brand_navy/15">
        {companyList.map((c) => {
          const isActive = activeCompany === c.id;
          const count = companyCounts[c.id] ?? 0;
          return (
            <div
              key={c.id}
              className={`w-full flex items-center gap-2 pl-2.5 pr-3 transition-colors ${
                isActive
                  ? "bg-brand_navy text-custom-white"
                  : "hover:bg-fill_soft text-content"
              }`}
            >
              <Checkbox
                checked={picks.companies.includes(c.id)}
                onChange={() => toggleCompanyPick(c.id)}
                ariaLabel={`Assign ${c.name} itself`}
              />
              <button
                onClick={() => selectCompany(c.id)}
                className="flex-1 min-w-0 flex items-center justify-between gap-2 py-2 text-left text-[12px] font-medium"
              >
                <span className="truncate">{c.name}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                      isActive
                        ? "bg-custom-white/20 text-custom-white"
                        : "bg-brand_navy/10 text-brand_navy"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CompanyColumn;
