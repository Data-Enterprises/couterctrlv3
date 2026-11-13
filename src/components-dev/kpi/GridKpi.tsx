interface GridKpiProps {
  label: string;
  value: string;
  /** Makes the figure a button, e.g. Stores opening its list. */
  onClick?: () => void;
  /** Whether what the button opens is showing. */
  open?: boolean;
}

/** One labelled figure in a grid's KPI strip, as Receivers draws one. */
const GridKpi = ({ label, value, onClick, open }: GridKpiProps) =>
  onClick ? (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      className={`w-full h-full min-w-0 px-4 py-2 text-center transition-colors hover:bg-brand_navy/[0.06] ${
        open ? "bg-brand_navy/[0.06]" : ""
      }`}
    >
      <div className="text-[10px] cc-caps-strong">
        {label}
      </div>
      <div className="text-[14px] font-bold text-brand_navy underline decoration-dotted underline-offset-4 truncate">
        {value}
      </div>
    </button>
  ) : (
    <div className="px-4 py-2 text-center min-w-0">
      <div className="text-[10px] cc-caps-strong">
        {label}
      </div>
      <div className="text-[14px] font-bold text-content truncate">{value}</div>
    </div>
  );

export default GridKpi;
