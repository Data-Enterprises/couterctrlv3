import { useMemo, useState } from "react";
import {
  decompose,
  tilesAt,
  type Cause,
  type ItemVerdict,
} from "../shared/deptInvestigation";
import { squarify } from "../shared/treemapLayout";

/**
 * The gap, as a shape.
 *
 * Two views of one number, each answering a question the item grid can state
 * but not show:
 *
 *   The walk  — from their week to ours, one cause at a time. Exact: every
 *               item's gap IS mine minus theirs, so the steps land on our
 *               total with nothing left over and nothing assumed.
 *   The map   — the same money by area, cause then vendor then item. Six
 *               items failing to arrive from one vendor on one order date is
 *               ONE missed delivery, and no item-by-item read surfaces that.
 *
 * Both are read-only pictures of `items` and both filter the grid: picking a
 * cause here is the same act as picking its chip up there, which is why they
 * share one piece of state rather than two that can disagree.
 */

const CAUSE_LABEL: Record<Cause, string> = {
  "never-ordered": "Never ordered",
  "not-received": "Didn't arrive",
  "not-moving": "Not moving",
  "price-mix": "Price / mix",
  ahead: "We're ahead",
  unclassified: "No cause found",
};

/** The same ramp the cause chips use, so a bar and a chip for one cause are
 *  recognisably the same thing. */
const CAUSE_FILL: Record<Cause, string> = {
  "never-ordered": "#931010",
  "not-received": "#7f4d00",
  "not-moving": "#5a6c84",
  "price-mix": "#647489",
  unclassified: "#8a9bb0",
  ahead: "#106038",
};

const PLOT_H = 230;
const BAR_W = 104;
const BAR_GAP = 20;
const MAP_H = 300;

interface Props {
  items: ItemVerdict[];
  fmt: (v: number) => string;
  openStoreNumber: string;
  compareStoreNumber: string;
  /** Shared with the cause chips above the grid. */
  only: Cause | null;
  onPickCause: (c: Cause | null) => void;
  onPickItem: (productCode: string) => void;
}

const GapBreakdown = ({
  items,
  fmt,
  openStoreNumber,
  compareStoreNumber,
  only,
  onPickCause,
  onPickItem,
}: Props) => {
  const [path, setPath] = useState<string[]>([]);

  const walk = useMemo(() => decompose(items), [items]);
  const tiles = useMemo(() => tilesAt(items, path), [items, path]);

  // One scale for the whole walk, so a step's height is comparable to the
  // totals either side of it.
  const top = Math.max(walk.theirs, walk.mine, 1);
  const y = (v: number) => PLOT_H - (v / top) * PLOT_H;

  type Bar = {
    key: string;
    label: string;
    money: string;
    fill: string;
    top: number;
    height: number;
    cause: Cause | null;
  };

  const bars: Bar[] = [];
  bars.push({
    key: "theirs",
    label: compareStoreNumber,
    money: fmt(walk.theirs),
    fill: "#5a6c84",
    top: y(walk.theirs),
    height: PLOT_H - y(walk.theirs),
    cause: null,
  });

  let running = walk.theirs;
  walk.steps.forEach((s) => {
    const from = running;
    const to = running + s.dollars;
    running = to;
    bars.push({
      key: s.cause,
      label: CAUSE_LABEL[s.cause],
      money: `${s.dollars >= 0 ? "+" : "−"}${fmt(Math.abs(s.dollars))}`,
      fill: CAUSE_FILL[s.cause],
      top: y(Math.max(from, to)),
      height: Math.max(3, Math.abs(y(from) - y(to))),
      cause: s.cause,
    });
  });

  bars.push({
    key: "mine",
    label: openStoreNumber,
    money: fmt(walk.mine),
    fill: "#178ec6",
    top: y(walk.mine),
    height: PLOT_H - y(walk.mine),
    cause: null,
  });

  const width = bars.length * BAR_W + (bars.length - 1) * BAR_GAP;
  const placed = squarify(tiles, 0, 0, 1, 1);
  const crumbs = ["All causes", ...path];

  return (
    <div className="flex-1 min-h-0 overflow-auto thin-scrollbar px-4 py-4">
      {/* ── The walk ─────────────────────────────────────────────── */}
      <h3 className="text-[12.5px] font-bold text-content">
        From {compareStoreNumber}&rsquo;s week to {openStoreNumber}&rsquo;s
      </h3>
      <p className="text-[11.5px] text-content/85 mt-0.5 mb-3">
        Every step is the sum of its items&rsquo; differences, so the walk
        lands on our total exactly. Click a step to hold that cause.
      </p>

      <div className="relative" style={{ width, height: PLOT_H + 56 }}>
        {bars.map((b, i) => {
          const held = b.cause !== null && b.cause === only;
          const dim = only !== null && b.cause !== null && !held;
          const left = i * (BAR_W + BAR_GAP);
          return (
            <button
              key={b.key}
              type="button"
              disabled={b.cause === null}
              onClick={() => b.cause && onPickCause(held ? null : b.cause)}
              title={b.cause ? `${b.label} — ${b.money}` : undefined}
              className="absolute top-0 p-0 m-0 border-0 bg-transparent text-left disabled:cursor-default"
              style={{ left, width: BAR_W, height: PLOT_H + 56 }}
            >
              <span
                className="absolute rounded-sm"
                style={{
                  left: 0,
                  top: b.top,
                  width: BAR_W,
                  height: b.height,
                  background: b.fill,
                  opacity: dim ? 0.35 : 1,
                  outline: held ? "2px solid rgb(var(--color-brand-navy))" : undefined,
                  outlineOffset: 2,
                }}
              />
              <span
                className="absolute text-[11.5px] font-bold tabular-nums w-full text-center"
                style={{ top: b.top - 18, color: dim ? "#5a6c84" : b.fill }}
              >
                {b.money}
              </span>
              <span
                className={`absolute text-[11px] leading-tight w-full text-center ${
                  held ? "font-bold text-content" : "text-content/85"
                }`}
                style={{ top: PLOT_H + 8 }}
              >
                {b.label}
              </span>
            </button>
          );
        })}
        <div
          className="absolute left-0 bg-brand_navy/15"
          style={{ top: PLOT_H, width, height: 1 }}
        />
      </div>

      {/* ── The map ──────────────────────────────────────────────── */}
      <div className="mt-7 flex items-baseline gap-2">
        <h3 className="text-[12.5px] font-bold text-content">
          Where it concentrates
        </h3>
        <span className="text-[11.5px] text-content/85">
          area is money · cause, then vendor, then item
        </span>
      </div>

      <div className="flex items-center gap-1.5 mt-2 mb-2">
        {crumbs.map((c, i) => (
          <button
            key={`${c}__${i}`}
            type="button"
            onClick={() => setPath(path.slice(0, i))}
            className={`text-[11.5px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${
              i === crumbs.length - 1
                ? "bg-filter_active border-filter_active_border text-content"
                : "bg-custom-white border-brand_line text-content hover:bg-gray-50"
            }`}
          >
            {i === 0 ? c : (CAUSE_LABEL[c as Cause] ?? c)}
          </button>
        ))}
      </div>

      {tiles.length === 0 ? (
        <p className="text-[12px] text-content/85 py-6">
          Nothing behind here.
        </p>
      ) : (
        <div className="relative w-full" style={{ height: MAP_H }}>
          {placed.map((t, i) => {
            // Lighter the further down the list, so the eye keeps the order
            // even where two tiles are nearly the same size.
            const base = path.length === 0 ? CAUSE_FILL[t.key as Cause] : CAUSE_FILL[path[0] as Cause];
            const fade = path.length === 0 ? 1 : Math.max(0.4, 0.95 - i * 0.07);
            const big = t.w > 0.12 && t.h > 0.2;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() =>
                  t.deeper ? setPath([...path, t.key]) : onPickItem(t.key)
                }
                title={`${t.label} — ${fmt(t.value)}${t.deeper ? "" : " · open its evidence"}`}
                className="absolute rounded-sm border-0 text-left overflow-hidden p-2 flex flex-col items-start gap-0.5 cursor-pointer"
                style={{
                  left: `${t.x * 100}%`,
                  top: `${t.y * 100}%`,
                  width: `calc(${t.w * 100}% - 3px)`,
                  height: `calc(${t.h * 100}% - 3px)`,
                  background: base,
                  opacity: fade,
                }}
              >
                <span className="text-[11.5px] font-semibold text-custom-white leading-tight max-w-full truncate">
                  {path.length === 0 ? CAUSE_LABEL[t.key as Cause] : t.label}
                </span>
                <span className="text-[15px] font-bold text-custom-white tabular-nums leading-none">
                  {fmt(t.value)}
                </span>
                {big && (
                  <span className="text-[10.5px] text-custom-white/85">
                    {t.items} {t.items === 1 ? "item" : "items"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GapBreakdown;
