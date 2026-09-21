import { useState } from "react";
import { colourFor, MUTED_OPACITY, hourLabel } from "./chartTheme";
import ChartTooltip from "./ChartTooltip";
import { isAll } from "./caseModel";
import type { HourProfile } from "./hourProfile";

/**
 * When in the day each exception happened, every type stacked.
 *
 * The muted series carry the argument. A cluster after seven is only evidence
 * if this cashier's *other* exceptions the same week are spread across the
 * trading day — if everything clusters, that is a shift, and the case should
 * say so rather than let a manager mistake a rota for a pattern.
 *
 * Empty trading hours are drawn as flat ticks rather than omitted. A chart
 * cropped to the busy hours would hide the very thing being claimed.
 */
interface Props {
  profile: HourProfile;
  types: string[];
  selected: string;
}

const W = 300;
const H = 160;
const X0 = 22;
const X1 = 288;
const Y0 = 20;
const Y1 = 136;

const HourStackChart = ({ profile, types, selected }: Props) => {
  const [hover, setHover] = useState<number | null>(null);
  const from = Math.max(0, profile.firstHour - 1);
  const to = Math.min(23, profile.lastHour + 1);
  const hours = Array.from({ length: to - from + 1 }, (_, i) => from + i);

  const totalAt = (h: number) =>
    types.reduce((acc, t) => acc + (profile.byType.get(t)?.[h] ?? 0), 0);
  const peak = Math.max(1, ...hours.map(totalAt));

  const slot = (X1 - X0) / hours.length;
  const barW = Math.max(4, Math.min(14, slot - 3));
  const unit = (Y1 - Y0) / peak;

  return (
    <div className="relative" onMouseLeave={() => setHover(null)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto overflow-visible"
        role="img"
        aria-label={`Exceptions by hour of day, ${types.join(", ")} stacked`}
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

        {hours.map((h, i) => {
          const left = X0 + i * slot + (slot - barW) / 2;
          // Selected type sits on the baseline so its height is read against the
          // axis rather than against whatever happens to be under it.
          const ordered = [selected, ...types.filter((t) => t !== selected)];
          let cursor = Y1;
          const total = totalAt(h);

          return (
            <g key={h}>
              {total === 0 && (
                <rect
                  x={left}
                  y={Y1 - 4}
                  width={barW}
                  height={4}
                  rx={2}
                  className="fill-gray-300"
                />
              )}
              {ordered.map((t) => {
                const n = profile.byType.get(t)?.[h] ?? 0;
                if (n === 0) return null;
                const height = n * unit;
                cursor -= height;
                return (
                  <rect
                    key={t}
                    x={left}
                    y={cursor}
                    width={barW}
                    height={Math.max(2, height - 1)}
                    rx={2}
                    fill={colourFor(types, t)}
                    opacity={
                      isAll(selected) || t === selected ? 1 : MUTED_OPACITY
                    }
                  />
                );
              })}
            </g>
          );
        })}

        {hours.map((h, i) =>
          h % 4 === 0 || h === to ? (
            <text
              key={`lbl-${h}`}
              x={X0 + i * slot + slot / 2}
              y={H - 8}
              textAnchor="middle"
              className={h === to ? "fill-content" : "fill-content/85"}
              style={{ fontSize: 9.5 }}
            >
              {hourLabel(h)}
            </text>
          ) : null,
        )}
        {/* Hit targets last so nothing else steals the pointer: one column per
          hour, full height, so an empty hour is still answerable. */}
        {hours.map((h, i) => (
          <rect
            key={`hit-${h}`}
            x={X0 + i * slot}
            y={Y0}
            width={slot}
            height={Y1 - Y0}
            fill="transparent"
            onMouseEnter={() => setHover(h)}
          />
        ))}
      </svg>

      {hover !== null && (
        <ChartTooltip
          xPct={((X0 + hours.indexOf(hover) * slot + slot / 2) / W) * 100}
          title={hourLabel(hover)}
          rows={types
            .map((t) => ({
              saleType: t,
              value: profile.byType.get(t)?.[hover] ?? 0,
            }))
            .filter((r) => r.value > 0)}
          names={types}
          selected={selected}
        />
      )}
    </div>
  );
};

export default HourStackChart;
