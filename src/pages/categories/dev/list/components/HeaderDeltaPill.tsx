// Utils
import { formatPct } from "../../../../../utils/severity";

interface HeaderDeltaPillProps {
  /** "LW" or "LY". */
  label: string;
  pct: number;
  /** The pill's look, from headerDeltaPill. */
  cls: string;
  /** A coverage note after the figure, from headerDeltaPill. */
  note: string;
  title: string | undefined;
}

/** One of the header's change pills beside the store's week total. */
const HeaderDeltaPill = ({
  label,
  pct,
  cls,
  note,
  title,
}: HeaderDeltaPillProps) => (
  <span
    title={title}
    className={`text-[12px] font-semibold px-2 py-0.5 rounded-full ${cls}`}
  >
    {label} {formatPct(pct)}
    {note}
  </span>
);

export default HeaderDeltaPill;
