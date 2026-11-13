// Utils
import { formatPct, pillClass } from "../../../../utils/severity";
import { DELTA_THRESHOLD } from "../utils";

interface DeltaPillProps {
  pct: number | null;
}

/** A change against a baseline as a chip, coloured past DELTA_THRESHOLD. */
const DeltaPill = ({ pct }: DeltaPillProps) => (
  <span
    className={`text-[13px] font-semibold px-1.5 py-1 rounded text-center whitespace-nowrap justify-self-end ${pillClass(pct, DELTA_THRESHOLD)}`}
  >
    {pct === null ? "—" : formatPct(pct)}
  </span>
);

export default DeltaPill;
