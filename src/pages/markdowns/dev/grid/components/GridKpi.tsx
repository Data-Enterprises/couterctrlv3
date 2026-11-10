interface GridKpiProps {
  label: string;
  value: string;
}

/** One labelled figure in the grid's KPI strip, as Receivers draws one. */
const GridKpi = ({ label, value }: GridKpiProps) => (
  <div className="px-4 py-2 text-center">
    <div className="text-[10px] font-bold uppercase tracking-wide text-content">
      {label}
    </div>
    <div className="text-[14px] font-bold text-content">{value}</div>
  </div>
);

export default GridKpi;
