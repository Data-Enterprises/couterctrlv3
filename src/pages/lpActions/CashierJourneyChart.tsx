import type { CashierJourney } from "./journeyModel";
import type { LpSeverity } from "./lpActionsMetrics";

/**
 * The connection plot.
 *
 * Deliberately a fixed radial layout rather than a force simulation: the
 * arrangement carries meaning here — exception types on the inner ring, lanes
 * on the outer one — and a physics layout would move a node between two
 * viewings of the same week, which is the last thing an investigation wants.
 * It also keeps the page free of a graph library.
 *
 * A node that other cashiers also reach gets a heavier ring. That is the only
 * decoration on the chart, because it is the only thing a link chart shows
 * that a table doesn't.
 */
const SEV_FILL: Record<LpSeverity, string> = {
  investigate: "rgb(var(--color-severity-critical-text))",
  watch: "rgb(var(--color-severity-watch-text))",
  steady: "rgb(var(--color-severity-healthy-text))",
};

const W = 620;
const H = 420;
const CX = W / 2;
const CY = H / 2;
const R_TYPE = 108;
const R_LANE = 182;

const onRing = (i: number, n: number, r: number, offset = -Math.PI / 2) => {
  const a = offset + (i / Math.max(n, 1)) * Math.PI * 2;
  return { x: CX + Math.cos(a) * r, y: CY + Math.sin(a) * r };
};

interface Props {
  journey: CashierJourney;
  selected: string | null;
  onSelect: (id: string | null) => void;
}

const CashierJourneyChart = ({ journey, selected, onSelect }: Props) => {
  const typePos = new Map(
    journey.types.map((t, i) => [
      t.name,
      onRing(i, journey.types.length, R_TYPE),
    ]),
  );
  const lanePos = new Map(
    journey.terminals.map((t, i) => [
      t.name,
      onRing(i, journey.terminals.length, R_LANE, -Math.PI / 2 + 0.35),
    ]),
  );

  const dim = (id: string) => selected !== null && selected !== id;
  const maxLink = Math.max(...journey.links.map((l) => l.count), 1);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      role="img"
      aria-label={`Connection plot for ${journey.cashierName}: ${journey.types.length} exception types across ${journey.terminals.length} lanes`}
    >
      {journey.links.map((l) => {
        const a = typePos.get(l.type);
        const b = lanePos.get(l.terminal);
        if (!a || !b) return null;
        const faded = dim(`type:${l.type}`) && dim(`lane:${l.terminal}`);
        return (
          <line
            key={`${l.type}-${l.terminal}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="currentColor"
            className="text-content"
            strokeOpacity={faded ? 0.08 : 0.28}
            strokeWidth={1 + (l.count / maxLink) * 3}
          />
        );
      })}

      {journey.types.map((t) => {
        const p = typePos.get(t.name)!;
        return (
          <line
            key={`spine-${t.name}`}
            x1={CX}
            y1={CY}
            x2={p.x}
            y2={p.y}
            stroke="currentColor"
            className="text-content"
            strokeOpacity={dim(`type:${t.name}`) ? 0.08 : 0.35}
            strokeWidth={1.5}
          />
        );
      })}

      {journey.terminals.map((t) => {
        const p = lanePos.get(t.name)!;
        const id = `lane:${t.name}`;
        const r = 9 + Math.min(t.count, 40) * 0.22;
        return (
          <g
            key={id}
            onClick={() => onSelect(selected === id ? null : id)}
            className="cursor-pointer"
            opacity={dim(id) ? 0.35 : 1}
          >
            <circle
              cx={p.x}
              cy={p.y}
              r={r}
              fill="rgb(var(--color-bkg))"
              stroke="currentColor"
              className="text-content"
              strokeWidth={t.sharedWith > 0 ? 2.5 : 1}
            />
            <text
              x={p.x}
              y={p.y + 3.5}
              textAnchor="middle"
              className="fill-content"
              style={{ fontSize: 10, fontWeight: 600 }}
            >
              {t.name}
            </text>
            {t.sharedWith > 0 && (
              <text
                x={p.x}
                y={p.y + r + 11}
                textAnchor="middle"
                className="fill-content"
                style={{ fontSize: 9 }}
              >
                +{t.sharedWith}
              </text>
            )}
          </g>
        );
      })}

      {journey.types.map((t) => {
        const p = typePos.get(t.name)!;
        const id = `type:${t.name}`;
        const r = 11 + Math.min(t.count, 60) * 0.22;
        return (
          <g
            key={id}
            onClick={() => onSelect(selected === id ? null : id)}
            className="cursor-pointer"
            opacity={dim(id) ? 0.35 : 1}
          >
            <circle
              cx={p.x}
              cy={p.y}
              r={r}
              fill={SEV_FILL[t.severity]}
              fillOpacity={0.9}
              stroke="rgb(var(--color-bkg))"
              strokeWidth={2}
            />
            <text
              x={p.x}
              y={p.y + 3.5}
              textAnchor="middle"
              fill="#fff"
              style={{ fontSize: 10, fontWeight: 700 }}
            >
              {t.count}
            </text>
            <text
              x={p.x}
              y={p.y - r - 5}
              textAnchor="middle"
              className="fill-content"
              style={{ fontSize: 10 }}
            >
              {t.name}
            </text>
          </g>
        );
      })}

      <circle
        cx={CX}
        cy={CY}
        r={34}
        fill="#1e2a4a"
        onClick={() => onSelect(null)}
        className="cursor-pointer"
      />
      <text
        x={CX}
        y={CY - 2}
        textAnchor="middle"
        fill="#fff"
        style={{ fontSize: 11, fontWeight: 700 }}
      >
        {journey.total}
      </text>
      <text
        x={CX}
        y={CY + 11}
        textAnchor="middle"
        fill="#fff"
        fillOpacity={0.85}
        style={{ fontSize: 9 }}
      >
        exceptions
      </text>
    </svg>
  );
};

export default CashierJourneyChart;
