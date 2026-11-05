// Utils
import { fmtDayLabel } from "../../../../../utils/dateLabels";

interface DayScopePickerProps {
  weekDates: string[];
  exportDays: Set<string>;
  onAll: () => void;
  onToggle: (iso: string) => void;
}

/** All week, or any of its days: the one scope every dataset follows. */
const DayScopePicker = ({ weekDates, exportDays, onAll, onToggle }: DayScopePickerProps) => {
  return (
    <>
      <button
        onClick={onAll}
        className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
          exportDays.size === 0
            ? "bg-brand_navy border-brand_navy text-custom-white"
            : "bg-custom-white border-gray-200 text-content"
        }`}
      >
        All week
      </button>
      {weekDates.map((iso) => (
        <button
          key={iso}
          onClick={() => onToggle(iso)}
          className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
            exportDays.has(iso)
              ? "bg-brand_navy border-brand_navy text-custom-white"
              : "bg-custom-white border-gray-200 text-content"
          }`}
        >
          {fmtDayLabel(iso)}
        </button>
      ))}
    </>
  );
};

export default DayScopePicker;
