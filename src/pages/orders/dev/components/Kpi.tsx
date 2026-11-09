/** One labelled figure in the report's KPI strip. */
const Kpi = ({ label, value }: { label: string; value: string }) => (
  <div className="px-4 pt-2.5 pb-2 text-center min-w-0">
    <div className="text-[10px] font-bold uppercase tracking-wide text-content">
      {label}
    </div>
    <div className="text-[13px] font-bold text-content truncate">{value}</div>
  </div>
);

export default Kpi;
