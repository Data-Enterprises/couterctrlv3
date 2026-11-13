interface TileProps {
  label: string;
  value: string;
  sub?: string;
}

/** One figure and its caption. */
const Tile = ({ label, value, sub }: TileProps) => (
  <div className="flex flex-col">
    <span className="text-[9.5px] font-semibold uppercase tracking-wider text-content/95">
      {label}
    </span>
    <span className="font-display text-[15px] font-bold tracking-tight text-content">
      {value}
    </span>
    {sub && <span className="text-[10.5px] text-content/95">{sub}</span>}
  </div>
);

export default Tile;
