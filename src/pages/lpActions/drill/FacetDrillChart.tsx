import { formatCurrency2 } from "../../../utils";
import type { FacetBranch } from "./facetModel";

/**
 * One exception type at the centre, re-branched by whichever axis is chosen.
 *
 * The same radial grammar as the rings it replaces, so the zoom reads as going
 * *into* the node rather than arriving somewhere else: the node you clicked is
 * still a circle, still severity-coloured, and the spokes still weigh by count.
 * What changed is only what the spokes mean.
 *
 * Every branch is drawn even when one dominates. A single fat spoke beside
 * eight thin ones is the finding; hiding the thin ones would leave a picture
 * that cannot be told apart from having only one branch.
 */
interface Props {
  centreLabel: string;
  centreCount: number;
  centreFill: string;
  branches: FacetBranch[];
  selected: string | null;
  onSelect: (key: string | null) => void;
}

const W = 620;
const H = 400;
const CX = W / 2;
const CY = H / 2;
const R = 132;
const CORE = 46;
/** Clear air between a circle's edge and anything drawn against it. */
const GAP = 7;
const LINE = 12;

const FacetDrillChart = ({
  centreLabel,
  centreCount,
  centreFill,
  branches,
  selected,
  onSelect,
}: Props) => {
  const peak = Math.max(1, ...branches.map((b) => b.count));
  const step = branches.length > 0 ? (Math.PI * 2) / branches.length : 0;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      role="img"
      aria-label={`${centreLabel} broken into ${branches.length} branches`}
    >
      {branches.map((b, i) => {
        // Start at the top and go clockwise, so a chronological facet reads
        // like a clock rather than starting arbitrarily on the right.
        const angle = -Math.PI / 2 + i * step;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const nodeX = CX + cos * R;
        const nodeY = CY + sin * R;
        const on = b.key === selected;
        const dim = selected !== null && !on;
        const radius = 11 + Math.sqrt(b.count / peak) * 15;

        // Both ends stop at a circle's edge. A spoke that runs under the node
        // and out the other side of the number reads as a line crossing the
        // circle rather than joining it.
        const inner = CORE + 2;
        const outer = R - radius - 2;

        // Near-vertical nodes have no room beside them, so their label stacks
        // clear of the circle instead — above when the node is above centre,
        // below when it is below, so the block never lands on the number.
        const vertical = Math.abs(cos) < 0.35;
        const labelX = vertical
          ? nodeX
          : nodeX + Math.sign(cos) * (radius + GAP);
        const anchor = vertical ? "middle" : cos > 0 ? "start" : "end";
        const firstY = vertical
          ? sin < 0
            ? nodeY - radius - GAP - LINE
            : nodeY + radius + GAP + 9
          : nodeY - 2;
        const secondY = firstY + LINE;

        return (
          <g
            key={b.key}
            onClick={() => onSelect(on ? null : b.key)}
            className="cursor-pointer"
            opacity={dim ? 0.4 : 1}
          >
            <line
              x1={CX + cos * inner}
              y1={CY + sin * inner}
              x2={CX + cos * outer}
              y2={CY + sin * outer}
              stroke={centreFill}
              strokeOpacity={on ? 0.9 : 0.35}
              strokeWidth={1 + (b.count / peak) * 5}
              strokeLinecap="round"
            />
            <circle
              cx={nodeX}
              cy={nodeY}
              r={radius}
              fill={centreFill}
              fillOpacity={on ? 0.9 : 0.18}
              stroke={centreFill}
              strokeWidth={on ? 2.5 : 1.5}
            />
            <text
              x={nodeX}
              y={nodeY + 4}
              textAnchor="middle"
              className={on ? "fill-custom-white" : "fill-content"}
              style={{ fontSize: 12, fontWeight: 600 }}
            >
              {b.count}
            </text>
            <text
              x={labelX}
              y={firstY}
              textAnchor={anchor}
              className="fill-content"
              style={{ fontSize: 11, fontWeight: on ? 600 : 400 }}
            >
              {b.label}
            </text>
            <text
              x={labelX}
              y={secondY}
              textAnchor={anchor}
              className="fill-content"
              style={{ fontSize: 10, opacity: 0.85 }}
            >
              {b.receipts} {b.receipts === 1 ? "receipt" : "receipts"} ·{" "}
              {formatCurrency2(b.value)}
            </text>
          </g>
        );
      })}

      <circle cx={CX} cy={CY} r={CORE} fill={centreFill} fillOpacity={0.92} />
      <text
        x={CX}
        y={CY - 4}
        textAnchor="middle"
        className="fill-custom-white"
        style={{ fontSize: 13, fontWeight: 700 }}
      >
        {centreLabel}
      </text>
      <text
        x={CX}
        y={CY + 12}
        textAnchor="middle"
        className="fill-custom-white"
        style={{ fontSize: 11, opacity: 0.9 }}
      >
        {centreCount}
      </text>
    </svg>
  );
};

export default FacetDrillChart;
