import { hueFor } from "../../typeColour";

/**
 * The legend for all three charts, once.
 *
 * Always present when more than one series is drawn — identity is never
 * carried by colour alone. It also doubles as the count-by-type for the week,
 * which is the question people ask of a legend anyway.
 */
interface Props {
  types: string[];
  counts: Record<string, number>;
}

const ChartLegend = ({ types, counts }: Props) => (
  <div className="flex flex-wrap gap-x-3.5 gap-y-1 mb-2">
    {types.map((t) => (
      <span key={t} className="flex items-center gap-1.5 text-[10.5px] text-content/85">
        <span
          className="w-2 h-2 rounded-sm flex-shrink-0"
          style={{ background: hueFor(t) }}
        />
        {t} <b className="font-semibold text-content">{counts[t] ?? 0}</b>
      </span>
    ))}
  </div>
);

export default ChartLegend;
