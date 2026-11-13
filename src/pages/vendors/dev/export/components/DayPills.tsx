// Utils
import { fmtDayLabel } from "../../../../../utils/dateLabels";

interface DayPillsProps {
  weekDates: string[];
  exportDays: Set<string>;
  onAll: () => void;
  onToggle: (iso: string) => void;
}

/** All week, or any of its days: the one scope every dataset follows. */
const DayPills = ({ weekDates, exportDays, onAll, onToggle }: DayPillsProps) => {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        onClick={onAll}
        className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
          exportDays.size === 0
            ? "bg-brand_navy border-brand_navy text-custom-white"
            : "bg-custom-white border-line_field text-content"
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
              : "bg-custom-white border-line_field text-content"
          }`}
        >
          {fmtDayLabel(iso)}
        </button>
      ))}
    </div>
  );
};

export default DayPills;
