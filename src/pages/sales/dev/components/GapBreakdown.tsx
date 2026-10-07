import { useMemo, useState } from "react";
import {
  decompose,
  tilesAt,
  type Cause,
  type ItemVerdict,
} from "../shared/deptInvestigation";
import { squarify } from "../shared/treemapLayout";

/**
 * The shortfall, as a shape.
 *
 * Two views of what is actually lost, which is NOT the net difference: a
 * store can be well ahead of its counterpart and still have two hundred items
 * it never ordered. The net is one number and the headline says it; this is
 * about the part somebody can do something with.
 *
 *   The bar  — the shortfall split by cause, one segment each. A waterfall
 *              was the obvious choice and it was wrong: with winners at
 *              $19.5K against a $142 miss, one step owned the scale and every
 *              other collapsed to a sliver floating in white space. A share
 *              bar reads the same at any ratio, which is the only property
 *              that matters when the ratios are a store's to decide.
 *   The map  — the same money by area, cause then vendor then item. Six items
 *              failing to arrive from one vendor on one order date is ONE
 *              missed delivery, and no item-by-item read surfaces that.
 *
 * Both filter the grid, and the cause filter is shared with the chips above
 * it, so the three cannot disagree.
 */

const CAUSE_LABEL: Record<Cause, string> = {
  "never-ordered": "Never ordered",
  "not-received": "Didn't arrive",
  cost: "Costing more",
  "not-moving": "Not moving",
  "price-mix": "Price / mix",
  ahead: "We're ahead",
  unclassified: "No cause found",
};

const CAUSE_OWNER: Record<Cause, string> = {
  "never-ordered": "buyer",
  "not-received": "vendor",
  cost: "buying terms",
  "not-moving": "merchandising",
  "price-mix": "same units, less money",
  ahead: "ours to keep",
  unclassified: "worth a look",
};

/** Ordered dark to light by how much somebody can do about it, so the bar
 *  reads left to right as most actionable first. */
/**
 * One hue per cause, matching the chip tones in `DeptInvestigation`.
 *
 * The two views share a cause filter, so a reader moves between them with a
 * cause already in mind — violet in the chip row and brown in the treemap
 * reads as two different findings. Solid enough to carry white type, which
 * is what a tile has to do at any size.
 */
const CAUSE_FILL: Record<Cause, string> = {
  "never-ordered": "#931010",
  "not-received": "#b06a1a",
  cost: "#5b21b6",
  "not-moving": "#1e4e8c",
  "price-mix": "#155e75",
  unclassified: "#a3b0c2",
  ahead: "#106038",
};

/** Lighter steps within one cause's drill, so forty vendors keep their order
 *  even where two are nearly the same size. */
const TINTS = ["", "0.86", "0.74", "0.64", "0.55", "0.47", "0.4"];

const MAP_H = 320;

interface Props {
  items: ItemVerdict[];
  fmt: (v: number) => string;
  openStoreNumber: string;
  compareStoreNumber: string;
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

  const losses = walk.steps.filter((s) => s.cause !== "ahead" && s.dollars < 0);
  const shortfall = losses.reduce((a, s) => a + Math.abs(s.dollars), 0);
  const ahead = walk.steps.find((s) => s.cause === "ahead")?.dollars ?? 0;
  const net = walk.mine - walk.theirs;

  const placed = squarify(tiles, 0, 0, 1, 1);
  const crumbs = ["All causes", ...path];

  return (
    <div className="flex-1 min-h-0 overflow-auto thin-scrollbar px-4 py-4">
      {/* ── The shortfall, split ─────────────────────────────────── */}
      <div className="flex items-baseline gap-2">
        <h3 className="text-[12.5px] font-bold text-content">
          What {openStoreNumber} is losing
        </h3>
        <span className="text-[13.5px] text-content/85">
          against {compareStoreNumber} · click a band to hold that cause
        </span>
        <span className="ml-auto text-[15px] font-bold tabular-nums text-delta_negative_text">
          {fmt(shortfall)}
        </span>
      </div>

      {shortfall === 0 ? (
        <p className="text-[12px] text-content/85 py-4">
          Nothing is behind in this department.
        </p>
      ) : (
        <>
          <div className="flex w-full h-11 rounded-md overflow-hidden mt-2.5">
            {losses.map((s) => {
              const share = Math.abs(s.dollars) / shortfall;
              const held = s.cause === only;
              const dim = only !== null && !held;
              return (
                <button
                  key={s.cause}
                  type="button"
                  onClick={() => onPickCause(held ? null : s.cause)}
                  title={`${CAUSE_LABEL[s.cause]} — ${fmt(Math.abs(s.dollars))} · ${CAUSE_OWNER[s.cause]}`}
                  className="h-full border-0 p-0 m-0 flex items-center justify-center transition-opacity"
                  style={{
                    width: `${share * 100}%`,
                    background: CAUSE_FILL[s.cause],
                    opacity: dim ? 0.4 : 1,
                    boxShadow: held
                      ? "inset 0 0 0 2px rgb(var(--color-brand-navy))"
                      : undefined,
                  }}
                >
                  {share > 0.08 && (
                    <span className="text-[11.5px] font-bold text-custom-white tabular-nums">
                      {Math.round(share * 100)}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* A legend, because a band under 8% has no room for its own
              label and dropping it would hide the small causes entirely. */}
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-2.5">
            {losses.map((s) => (
              <button
                key={s.cause}
                type="button"
                onClick={() => onPickCause(s.cause === only ? null : s.cause)}
                className="flex items-center gap-1.5 text-[13.5px]"
              >
                <span
                  className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ background: CAUSE_FILL[s.cause] }}
                />
                <span
                  className={
                    s.cause === only ? "font-bold text-content" : "text-content"
                  }
                >
                  {CAUSE_LABEL[s.cause]}
                </span>
                <span className="tabular-nums text-content/85">
                  {fmt(Math.abs(s.dollars))}
                </span>
                <span className="text-content/85">· {CAUSE_OWNER[s.cause]}</span>
              </button>
            ))}
          </div>

          {/* The counterweight, stated rather than drawn. As a step in a walk
              it dwarfed every loss; as a sentence it says the same thing and
              costs nothing. */}
          <p className="text-[13.5px] text-content/85 mt-3">
            Offset by{" "}
            <span className="font-semibold text-delta_positive_text">
              {fmt(ahead)}
            </span>{" "}
            where {openStoreNumber} is ahead — net{" "}
            <span
              className={`font-semibold ${
                net >= 0 ? "text-delta_positive_text" : "text-delta_negative_text"
              }`}
            >
              {net >= 0 ? "+" : "−"}
              {fmt(Math.abs(net))}
            </span>
            .
          </p>
        </>
      )}

      {/* ── The map ──────────────────────────────────────────────── */}
      <div className="mt-6 flex items-baseline gap-2">
        <h3 className="text-[12.5px] font-bold text-content">
          Where it concentrates
        </h3>
        <span className="text-[13.5px] text-content/85">
          area is money · cause, then vendor, then item
        </span>
      </div>

      <div className="flex items-center gap-1.5 mt-2 mb-2">
        {crumbs.map((c, i) => (
          <button
            key={`${c}__${i}`}
            type="button"
            onClick={() => setPath(path.slice(0, i))}
            className={`text-[13.5px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${
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
        <p className="text-[12px] text-content/85 py-6">Nothing behind here.</p>
      ) : (
        /* overflow-hidden, because a rectangle on the bottom edge rounds to a
           pixel past it and clips its own label against the container. */
        <div
          className="relative w-full rounded-md overflow-hidden"
          style={{ height: MAP_H }}
        >
          {placed.map((t, i) => {
            const fill =
              path.length === 0
                ? CAUSE_FILL[t.key as Cause]
                : CAUSE_FILL[path[0] as Cause];
            const tint = TINTS[Math.min(i, TINTS.length - 1)];
            const wide = t.w > 0.1;
            const tall = t.h > 0.16;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() =>
                  t.deeper ? setPath([...path, t.key]) : onPickItem(t.key)
                }
                title={`${t.label} — ${fmt(t.value)} · ${t.items} ${
                  t.items === 1 ? "item" : "items"
                }${t.deeper ? " · open" : " · see its evidence"}`}
                className="absolute border-0 text-left overflow-hidden p-2 flex flex-col items-start justify-start gap-0.5 cursor-pointer hover:brightness-110 transition-[filter]"
                style={{
                  left: `${t.x * 100}%`,
                  top: `${t.y * 100}%`,
                  width: `${t.w * 100}%`,
                  height: `${t.h * 100}%`,
                  background: fill,
                  opacity: path.length === 0 ? 1 : Number(tint || 1),
                  outline: "2px solid rgb(var(--color-custom-white))",
                  outlineOffset: -1,
                }}
              >
                {wide && tall && (
                  <>
                    <span className="text-[11.5px] font-semibold text-custom-white leading-tight max-w-full truncate">
                      {path.length === 0 ? CAUSE_LABEL[t.key as Cause] : t.label}
                    </span>
                    <span className="text-[15px] font-bold text-custom-white tabular-nums leading-none">
                      {fmt(t.value)}
                    </span>
                    <span className="text-[10.5px] text-custom-white/85">
                      {t.items} {t.items === 1 ? "item" : "items"}
                    </span>
                  </>
                )}
                {wide && !tall && (
                  <span className="text-[11px] font-semibold text-custom-white truncate max-w-full">
                    {path.length === 0 ? CAUSE_LABEL[t.key as Cause] : t.label}
                    <span className="font-normal text-custom-white/85">
                      {" "}
                      {fmt(t.value)}
                    </span>
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
