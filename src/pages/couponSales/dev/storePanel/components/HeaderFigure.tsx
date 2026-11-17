interface HeaderFigureProps {
  label: string;
  value: string;
}

/** One labelled total in the store panel's header, as LP's Sales/Trans/Qty run reads. */
const HeaderFigure = ({ label, value }: HeaderFigureProps) => (
  <span className="text-[10px] uppercase tracking-wide text-custom-white/95">
    {label}{" "}
    <span className="text-[13px] cc-navy-title normal-case tracking-normal">
      {value}
    </span>
  </span>
);

export default HeaderFigure;
