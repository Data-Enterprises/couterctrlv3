// Hooks
import { useAppDispatch } from "../../../hooks";
import { useEventPerfCtx } from "../hooks";

// Redux
import { ROWS_PER_PAGE, setEventInfoOpen, showMoreEvents } from "../../../features/dev/devEventPerfSlice";

// Utils
import { fmtInt } from "../utils/display";

// Interfaces
import type { HelpPage } from "../../../constants/helpPages";

// Components
import InfoModal from "../../InfoModal";
import { TY_COLOR } from "../../mobile/perf/perfColors";
import ScopeCard from "./ScopeCard";
import ScopeOpenPanel from "./ScopeOpenPanel";
import StoreListControls from "./StoreListControls";
import EventStoreCard from "./EventStoreCard";
import TypePickerSheet from "./TypePickerSheet";

interface EventListScreenProps {
  allLabel: string;
  measure: "transactions" | "amount";
  helpPage: HelpPage;
  storeFilter: string;
  setStoreFilter: (v: string) => void;
}

/** The screen: the scope card, then the stores as an accordion of cards. */
const EventListScreen = ({
  allLabel,
  measure,
  helpPage,
  storeFilter,
  setStoreFilter,
}: EventListScreenProps) => {
  const dispatch = useAppDispatch();
  const {
    perf,
    listScroll,
    scroller,
    openCard,
    scopeOpen,
    multiStore,
    listBuilding,
    listRows,
    visibleStores,
    typePickerOpen,
  } = useEventPerfCtx();

  return (
    <div className="flex h-[calc(100dvh-3rem)] flex-col overflow-hidden bg-bkg">
      {/* pb-14 clears the fixed bottom tab bar, which is outside document flow
          and would otherwise hide the last card. */}
      <div
        ref={scroller}
        onScroll={(e) => (listScroll.current = e.currentTarget.scrollTop)}
        className="flex-1 overflow-y-auto pb-14"
      >
        {/* ── the scope card, and the screen's filter ────────────── */}
        {/* The type is chosen from the title rather than swiped to: the picker
            lists every type with its figures. */}
        <ScopeCard allLabel={allLabel} measure={measure} />

        <div className="flex flex-col gap-3 p-3">
          {/* ── the scope card, opened ──────────────────────────── */}
          {/* The carousel above already carries its figures, so opening it adds
              the week and the way down rather than repeating them. */}
          {scopeOpen && <ScopeOpenPanel />}

          {/* ── how the list is ordered ─────────────────────────── */}
          {multiStore && (
            <StoreListControls
              measure={measure}
              storeFilter={storeFilter}
              setStoreFilter={setStoreFilter}
            />
          )}

          {/* ── the stores ──────────────────────────────────────── */}
          {multiStore &&
            (listBuilding ? (
              <section
                className="rounded-2xl border border-line_field bg-custom-white px-4 py-10 text-center text-[12.5px] text-content/95 shadow-md"
                style={{ animation: "delayed-fade-in 140ms ease-out 200ms both" }}
              >
                Building the list...
              </section>
            ) : listRows.length === 0 ? (
              <section className="rounded-2xl border border-line_field bg-custom-white px-4 py-8 text-center text-[12.5px] text-content/95 shadow-md">
                {storeFilter.trim()
                  ? `No store matches "${storeFilter.trim()}".`
                  : "Nothing recorded for this selection."}
              </section>
            ) : (
              listRows.map((r) => (
                <div
                  key={r.key}
                  ref={perf.selectedStoreKey === r.key ? openCard : undefined}
                >
                  <EventStoreCard r={r} measure={measure} />
                </div>
              ))
            ))}

          {multiStore && !listBuilding && visibleStores.length > listRows.length && (
            <button
              type="button"
              onClick={() => dispatch(showMoreEvents())}
              className="rounded-2xl border border-line_field bg-custom-white py-3 text-center text-[12px] font-semibold shadow-md active:bg-bkg"
              style={{ color: TY_COLOR }}
            >
              Show {ROWS_PER_PAGE} more
              <span className="text-content/95">
                {" "}
                · {fmtInt(visibleStores.length - listRows.length)} left
              </span>
            </button>
          )}
        </div>
      </div>

      {typePickerOpen && <TypePickerSheet allLabel={allLabel} measure={measure} />}

      <InfoModal
        page={helpPage}
        isOpen={perf.infoOpen}
        onClose={() => dispatch(setEventInfoOpen(false))}
      />
    </div>
  );
};

export default EventListScreen;
