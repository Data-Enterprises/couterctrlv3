// Redux
import {
  setSelectedDays,
  toggleDay,
} from "../../../../../features/dev/devExportBuilderSlice";

// Utils
import { dayLabel } from "../utils";

// Interfaces
import type { AppDispatch } from "../../../../../store";
import type { ExportCtx } from "../interfaces";

// Components
import Checkbox from "../../../../../components-dev/Checkbox";
import AllNone from "./AllNone";
import ConfigRow from "./ConfigRow";

interface DaysSectionProps {
  days: ExportCtx["days"];
  selectedDays: ExportCtx["selectedDays"];
  dispatch: AppDispatch;
  isOpen: boolean;
  onToggle: () => void;
}

/** The Days row: particular days inside the loaded range, each with its
 *  weekday, ticked in or out. */
const DaysSection = ({
  days,
  selectedDays,
  dispatch,
  isOpen,
  onToggle,
}: DaysSectionProps) => (
  <ConfigRow
    label="Days"
    isOpen={isOpen}
    onToggle={onToggle}
    summary={
      selectedDays.length === days.length
        ? `all ${days.length}`
        : `${selectedDays.length} of ${days.length}`
    }
  >
    <div className="px-3 pb-3 flex flex-col gap-1.5">
      <AllNone
        onAll={() => dispatch(setSelectedDays(days))}
        onNone={() => dispatch(setSelectedDays([]))}
      />
      <span className="text-[11px] text-content/95">
        Particular days inside the range, not a second range.
      </span>
      <div className="overflow-y-auto thin-scrollbar flex flex-col max-h-[38vh]">
        {days.map((d) => (
          <Checkbox
            key={d}
            checked={selectedDays.includes(d)}
            onChange={() => dispatch(toggleDay(d))}
            className="py-1.5 text-[12.5px] border-b border-brand_line last:border-0"
            label={
              <span className="font-mono text-[11.5px]">{dayLabel(d)}</span>
            }
          />
        ))}
      </div>
    </div>
  </ConfigRow>
);

export default DaysSection;
