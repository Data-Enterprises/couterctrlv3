// Hooks
import { useAppDispatch } from "../../../../../hooks";
import { useEventPerfCtx } from "../hooks";

// Redux
import { openEventDetail, toggleEventGroupDay } from "../../../../../features/dev/devEventPerfSlice";

// Components
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import PerfDayChart from "../../../../../components-dev/mobile/perf/PerfDayChart";
import { TY_SWATCH_BG } from "../../../../../components-dev/mobile/perf/perfColors";

/** The scope card, opened: its week by day and the way down to the detail. */
const ScopeOpenPanel = () => {
  const dispatch = useAppDispatch();
  const { days, shownGroup, multiStore } = useEventPerfCtx();
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-300 bg-custom-white shadow-md">
      <div className="px-3.5 pb-1 pt-3">
        <PerfDayChart
          days={days.map((d) => ({
            iso: d.iso,
            label: d.label,
            ty: d.value,
            ly: d.baseline,
          }))}
          // The DEFERRED day — the chart and the rows it scopes have to
          // move on the same render.
          selected={shownGroup.day}
          onToggle={(iso) => dispatch(toggleEventGroupDay(iso))}
        />
        <div className="mt-1 flex gap-3.5 px-1 text-[12px] text-content/95">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-3.5 rounded-sm"
              style={{ background: TY_SWATCH_BG }}
            />
            This week
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-3.5 rounded-sm"
              style={{ background: "#5a6c84" }}
            />
            Prior 2-wk avg
          </span>
        </div>
        <p className="px-1 pt-1 text-[12px] text-content/95">
          {shownGroup.day
            ? "Tap the selected day again for the full week."
            : multiStore
              ? "Tap a day to scope the screen to it."
              : "Tap a day to scope this store to it."}
        </p>
      </div>
      <div className="px-3.5 pb-3.5 pt-2">
        <button
          type="button"
          onClick={() => dispatch(openEventDetail(true))}
          className="flex w-full items-center justify-center gap-1 rounded-lg bg-brand_navy py-2.5 text-[12.5px] font-bold text-custom-white active:bg-[#2a3a62]"
        >
          View details
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
};

export default ScopeOpenPanel;
