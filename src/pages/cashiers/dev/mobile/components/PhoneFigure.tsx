interface PhoneFigureProps {
  label: string;
  value: string;
  /** Line digits up in columns, for a figure among others in a row. */
  tabular?: boolean;
}

/** A small centred figure on a phone card: a mono caption over the value. */
const PhoneFigure = ({ label, value, tabular = false }: PhoneFigureProps) => (
  <div className="flex flex-col items-center text-center">
    <span className="cc-caps-mono text-[9.5px]">{label}</span>
    <span
      className={
        tabular
          ? "font-display text-[15px] font-bold tabular-nums text-content"
          : "font-display text-[15px] font-bold text-content"
      }
    >
      {value}
    </span>
  </div>
);

export default PhoneFigure;
