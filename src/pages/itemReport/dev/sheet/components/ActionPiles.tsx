// Hooks
import { useAppDispatch } from "../../../../../hooks";
import { useItemReportCtx } from "../../hooks";

// Redux
import {
  setItemReportActionFilter,
  setItemReportDeptFilter,
  setItemReportVendorFilter,
} from "../../../../../features/dev/devItemReportSlice";

// Utils
import { ACTION_TONE } from "../../utils/actionTone";
import { ACTION_LABEL } from "../../utils/verdict";
import { ORDER } from "../../utils";

// Interfaces
import type { ActionKind } from "../../interfaces";
import type { MultiSelectOption } from "../../../../../components-dev/filters/interfaces";

// Components
import SelectFilter from "../../../../../components-dev/filters/SelectFilter";

interface ActionPilesProps {
  counts: Record<ActionKind, number>;
  deptOpts: MultiSelectOption[];
  vendorOpts: MultiSelectOption[];
}

/**
 * The piles: one chip per action with its count, and the department and vendor
 * menus. Clicking a chip narrows the sheet to that action. The menus sit apart
 * from the chips because they are another dimension (whose shelf it is), and
 * they show even with one choice so the toolbar never moves.
 */
const ActionPiles = ({ counts, deptOpts, vendorOpts }: ActionPilesProps) => {
  const dispatch = useAppDispatch();
  const {
    actionFilter: only,
    deptFilter: dept,
    vendorFilter: vendor,
  } = useItemReportCtx();

  return (
    <div
      data-help="piles"
      className="flex-shrink-0 px-3 py-2 border-b border-line_hair flex items-center gap-1.5 flex-wrap"
    >
      {ORDER.map((action) => (
        <button
          key={action}
          onClick={() =>
            dispatch(setItemReportActionFilter(only === action ? null : action))
          }
          className={`text-[12px] font-semibold px-2 py-1 rounded-full transition-shadow ${ACTION_TONE[action].chip} ${
            only === action
              ? `ring-2 shadow-sm ${ACTION_TONE[action].ring}`
              : ""
          }`}
        >
          {ACTION_LABEL[action]}{" "}
          <span className="tabular-nums">{counts[action]}</span>
        </button>
      ))}
      <div className="flex-1" />
      <SelectFilter
        options={deptOpts}
        value={dept}
        onChange={(v) => dispatch(setItemReportDeptFilter(v))}
        placeholder="All sub depts"
        className="w-[150px]"
      />
      <SelectFilter
        options={vendorOpts}
        value={vendor}
        onChange={(v) => dispatch(setItemReportVendorFilter(v))}
        placeholder="All vendors"
        className="w-[150px]"
      />
    </div>
  );
};

export default ActionPiles;
