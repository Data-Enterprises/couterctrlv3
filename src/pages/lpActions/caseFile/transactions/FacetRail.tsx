import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { toggleLpFacet } from "../../../../features/lpActionsSlice";
import type { FacetGroup } from "./facetsModel";

/**
 * Every filter is also a distribution.
 *
 * Each row is a button with a bar behind it scaled to its share of the group,
 * so the rail answers "when does this happen" before anyone clicks anything —
 * a lane holding 80 of 141 exceptions is visible without reading a number.
 *
 * The counts are conditional: they already have every OTHER group's filter
 * applied, so a row reads "if I also picked this, I'd get N more" rather than
 * "this is what exists in the whole week".
 */
interface Props {
  groups: FacetGroup[];
}

const FacetRail = ({ groups }: Props) => {
  const dispatch = useAppDispatch();
  const facets = useAppSelector((s) => s.lpActions.facets);

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden self-start">
      {groups.map((group) => {
        const peak = Math.max(...group.values.map((v) => v.count), 1);
        return (
          <div
            key={group.key}
            className="px-2.5 py-2.5 border-b border-gray-100 last:border-b-0"
          >
            <div className="text-[9px] font-semibold uppercase tracking-wide text-content/85 mb-1.5">
              {group.label}
            </div>

            {group.values.map((v) => {
              const on = (facets[group.key] ?? []).includes(v.value);
              return (
                <button
                  key={v.value}
                  aria-pressed={on}
                  onClick={() =>
                    dispatch(
                      toggleLpFacet({ key: group.key, value: v.value }),
                    )
                  }
                  className={`relative w-full grid grid-cols-[1fr_auto] items-center gap-2 rounded px-1.5 py-[3px] text-left transition-colors ${
                    on
                      ? "bg-filter_active ring-1 ring-filter_active_border"
                      : "hover:bg-row_stripe"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`absolute inset-y-0 left-0 rounded-sm ${
                      on ? "bg-filter_active_border/15" : "bg-row_stripe"
                    }`}
                    style={{ width: `${(v.count / peak) * 100}%` }}
                  />
                  <span className="relative z-10 flex items-center gap-1.5 min-w-0 text-[11.5px] text-content">
                    {v.swatch && (
                      <span
                        className="w-2 h-2 rounded-sm flex-shrink-0"
                        style={{ background: v.swatch }}
                      />
                    )}
                    <span className="truncate">{v.label}</span>
                  </span>
                  <span className="relative z-10 text-[10.5px] text-content/85">
                    {v.count}
                  </span>
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default FacetRail;
