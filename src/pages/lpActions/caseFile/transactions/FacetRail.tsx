import { useAppDispatch, useAppSelector } from "../../../../hooks";
import {
  toggleLpFacet,
  toggleLpFacetGroup,
} from "../../../../features/lpActionsSlice";
import { ChevronRightIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import type { FacetGroup } from "./facetsModel";

/**
 * Every filter is also a distribution.
 *
 * Dressed as Loss Prevention's own cashier column, because it does the same
 * job in the same place: pick a row on the left, watch the grid on the right
 * narrow. Selection is `row_selected` with a left border rather than the
 * filter-blue — LP marks a picked row this way and a second convention for the
 * same gesture is one the reader has to learn twice.
 *
 * The counts are conditional: they already have every OTHER group's filter
 * applied, so a row reads "if I also picked this, I'd get N more" rather than
 * "this is what exists in the whole week".
 *
 * Groups collapse, the way the roster's stores do, with the values indented
 * under their header. Five groups fully open is a column of thirty rows before
 * anyone has asked a question of any of them.
 *
 * A group holding an active filter is open whether or not it was expanded by
 * hand — a filter you cannot see is one you cannot take off.
 */
interface Props {
  groups: FacetGroup[];
}

const FacetRail = ({ groups }: Props) => {
  const dispatch = useAppDispatch();
  const { facets, expandedFacets } = useAppSelector((s) => s.lpActions);

  return (
    <div>
      {groups.map((group) => {
        const active = facets[group.key] ?? [];
        const open = expandedFacets.includes(group.key) || active.length > 0;
        const Chevron = open ? ChevronDownIcon : ChevronRightIcon;

        return (
          <div key={group.key}>
            {/* The group header, on LP's column-header ground. */}
            <button
              onClick={() => dispatch(toggleLpFacetGroup(group.key))}
              aria-expanded={open}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 bg-gray-100 border-b border-gray-100 text-left hover:bg-gray-200 transition-colors"
            >
              <Chevron className="w-3.5 h-3.5 flex-shrink-0 text-content/85" />
              <span className="flex-1 min-w-0 text-[12px] font-semibold uppercase tracking-wide text-content/85 truncate">
                {group.label}
              </span>
              {active.length > 0 && (
                <span className="flex-shrink-0 text-[12px] font-semibold text-content">
                  {active.length}
                </span>
              )}
            </button>

            {open && (
              // Indented under the header. The rows carry their own left
              // border for selection, so a second guide rule beside it would
              // be two lines saying different things a pixel apart.
              <div className="pl-[18px]">
                {group.values.map((v) => {
                  const on = active.includes(v.value);
                  return (
                    <button
                      key={v.value}
                      aria-pressed={on}
                      onClick={() =>
                        dispatch(
                          toggleLpFacet({ key: group.key, value: v.value }),
                        )
                      }
                      className={`w-full grid grid-cols-[1fr_auto] border-l-2 border-b border-b-[#1e2a4a]/15 transition-colors text-left ${
                        on
                          ? "bg-row_selected border-row_selected_border"
                          : "border-transparent hover:bg-gray-50"
                      }`}
                    >
                      <div className="px-2 py-[9px] flex items-center gap-1.5 min-w-0">
                        {v.swatch && (
                          <span
                            className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                            style={{ background: v.swatch }}
                          />
                        )}
                        <span className="text-[13px] font-medium text-content truncate">
                          {v.label}
                        </span>
                      </div>
                      <div className="px-2 py-[9px] text-[13px] font-semibold text-content text-right">
                        {v.count}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FacetRail;
