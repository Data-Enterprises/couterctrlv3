import { useState } from "react";
import { colourFor, MUTED_OPACITY } from "./chartTheme";
import ChartTooltip from "./ChartTooltip";
import { isAll } from "./caseModel";
import type { CaseType } from "./caseModel";
import type { WeekWindow } from "../lpActionsMetrics";
import { formatDateSimple } from "../../../utils";

/**
 * Weekly counts for every exception type this cashier touched.
 *
 * Raw counts, not multiples. At cashier level the numbers are small and
 * comparable, so an index would add a conversion without solving anything —
 * and a case wants "20 refunds", with the multiplier already on the tab above.
 *
 * The selected type is drawn solid and the rest muted. Only emphasis changes
 * between tabs: the plotted shape stays identical, so switching re-points
 * attention at a picture the reader has already learned rather than handing
 * them a new one.
 *
 * Hovering reads the whole week rather than one line. Four series and four
 * weeks is sixteen numbers, and the question is always "what else moved that
 * week" — a per-line tooltip would make the reader ask it four times.
 */
interface Props {
  types: CaseType[];
  windows: WeekWindow[];
  selected: string;
}

const W = 300;
const H = 160;
const X0 = 22;
const X1 = 250;
const Y0 = 20;
const Y1 = 136;
/** Minimum vertical space between two end-of-line totals. */
const LABEL_GAP = 11;

const WeekLinesChart = ({ types, windows, selected }: Props) => {
  const [hover, setHover] = useState<number | null>(null);
  const names = types.map((t) => t.saleType);
  const peak = Math.max(1, ...types.flatMap((t) => t.perWeek));
  const stepX = windows.length > 1 ? (X1 - X0) / (windows.length - 1) : 0;
  const x = (i: number) => X0 + i * stepX;
  const y = (v: number) => Y1 - (v / peak) * (Y1 - Y0);

  // Two series that finish level would print their totals on top of each
  // other, which is exactly when the reader most needs to tell them apart.
  // Walk the ends from the top and push each one down to clear the last.
  const endLabels = types
    .map((t) => {
      const value = t.perWeek[t.perWeek.length - 1] ?? 0;
      return {
        saleType: t.saleType,
        value,
        on: isAll(selected) || t.saleType === selected,
      };
    })
    .sort((a, b) => b.value - a.value)
    .reduce<{ saleType: string; value: number; on: boolean; labelY: number }[]>(
      (acc, e) => {
        const wanted = y(e.value);
        const previous = acc[acc.length - 1];
        const labelY =
          previous && wanted - previous.labelY < LABEL_GAP
            ? previous.labelY + LABEL_GAP
            : wanted;
        return [...acc, { ...e, labelY }];
      },
      [],
    );

  const band = windows.length > 1 ? stepX : X1 - X0;

  return (
    <div className="relative" onMouseLeave={() => setHover(null)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto overflow-visible"
        role="img"
        aria-label={`Weekly counts for ${names.join(", ")} across ${windows.length} weeks`}
      >
        <line
          x1={X0}
          y1={Y0}
          x2={X1}
          y2={Y0}
          stroke="currentColor"
          className="text-gray-200"
        />
        <line
          x1={X0}
          y1={(Y0 + Y1) / 2}
          x2={X1}
          y2={(Y0 + Y1) / 2}
          stroke="currentColor"
          className="text-gray-200"
        />
        <line
          x1={X0}
          y1={Y1}
          x2={X1}
          y2={Y1}
          stroke="currentColor"
          className="text-gray-300"
        />

        {hover !== null && (
          <line
            x1={x(hover)}
            y1={Y0}
            x2={x(hover)}
            y2={Y1}
            stroke="currentColor"
            className="text-gray-300"
          />
        )}

        <text
          x={X0 - 4}
          y={Y0 + 4}
          textAnchor="end"
          className="fill-content/85"
          style={{ fontSize: 9.5 }}
        >
          {peak}
        </text>
        <text
          x={X0 - 4}
          y={Y1 + 4}
          textAnchor="end"
          className="fill-content/85"
          style={{ fontSize: 9.5 }}
        >
          0
        </text>
        <text
          x={X0}
          y={H - 8}
          textAnchor="middle"
          className="fill-content/85"
          style={{ fontSize: 9.5 }}
        >
          {formatDateSimple(windows[0]?.end ?? "")}
        </text>
        <text
          x={X1}
          y={H - 8}
          textAnchor="middle"
          className="fill-content"
          style={{ fontSize: 9.5 }}
        >
          {formatDateSimple(windows[windows.length - 1]?.end ?? "")}
        </text>

        {types.map((t) => {
          const on = isAll(selected) || t.saleType === selected;
          return (
            <polyline
              key={t.saleType}
              points={t.perWeek.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
              fill="none"
              stroke={colourFor(names, t.saleType)}
              strokeWidth={on ? 2.5 : 2}
              strokeOpacity={on ? 1 : MUTED_OPACITY}
              strokeLinejoin="round"
            />
          );
        })}

        {hover !== null &&
          types.map((t) => (
            <circle
              key={`dot-${t.saleType}`}
              cx={x(hover)}
              cy={y(t.perWeek[hover] ?? 0)}
              r={3}
              fill={colourFor(names, t.saleType)}
              fillOpacity={
                isAll(selected) || t.saleType === selected ? 1 : MUTED_OPACITY
              }
              stroke="rgb(var(--color-custom-white))"
              strokeWidth={1.5}
            />
          ))}

        {endLabels.map((e) => (
          <g key={`end-${e.saleType}`}>
            {e.on && (
              <circle
                cx={x(windows.length - 1)}
                cy={y(e.value)}
                r={4}
                fill={colourFor(names, e.saleType)}
                stroke="rgb(var(--color-custom-white))"
                strokeWidth={2}
              />
            )}
            <text
              x={X1 + 6}
              y={e.labelY + 3.5}
              className={e.on ? "fill-content" : "fill-content/85"}
              style={{ fontSize: 10, fontWeight: e.on ? 600 : 400 }}
            >
              {e.value}
            </text>
          </g>
        ))}

        {/* Hit targets last so nothing else steals the pointer. A band per
            week, wider than the line, because a 2px stroke is not a target. */}
        {windows.map((w, i) => (
          <rect
            key={`hit-${w.start}`}
            x={x(i) - band / 2}
            y={Y0}
            width={band}
            height={Y1 - Y0}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}
      </svg>

      {hover !== null && (
        <ChartTooltip
          xPct={(x(hover) / W) * 100}
          title={`Week ending ${formatDateSimple(windows[hover]?.end ?? "")}`}
          rows={types.map((t) => ({
            saleType: t.saleType,
            value: t.perWeek[hover] ?? 0,
          }))}
          names={names}
          selected={selected}
        />
      )}
    </div>
  );
};

export default WeekLinesChart;
