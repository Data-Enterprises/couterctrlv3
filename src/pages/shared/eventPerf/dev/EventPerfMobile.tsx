// Hooks
import { useState } from "react";
import { EventPerfCtx, useEventPerfView } from "./hooks";

// Interfaces
import type { EventPerfMobileProps } from "./interfaces";

// Components
import EventLoading from "./components/EventLoading";
import EventSearchScreen from "./components/EventSearchScreen";
import EventDetailScreen from "./components/EventDetailScreen";
import EventListScreen from "./components/EventListScreen";

/**
 * Loss Prevention and Coupon Sales on a phone, without grading.
 *
 * Three tabs over one flat set of events — stores, the people in them, and the
 * receipts. The event type is not a level in that hierarchy: it is a lens, and
 * it lives in a carousel of summary cards across the top. The first card is
 * everything at once; swiping to the next filters the whole screen to that
 * type. It used to be a screen you passed through, which meant comparing voids
 * to refunds cost you your place in the drill.
 *
 * Both pages load their whole week up front, so swiping regroups rows already
 * in hand rather than firing a request.
 */
const EventPerfMobile = (props: EventPerfMobileProps) => {
  const { title, description, buttonLabel, allLabel, measure, helpPage } = props;
  /** Narrows a long store list. Ephemeral by design — it describes what you
   *  are looking for right now, not what the search returned. */
  const [storeFilter, setStoreFilter] = useState("");
  /** The type picker. Local: it is a menu, not a place you can be. */
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const view = useEventPerfView(props, storeFilter);
  const { perf, mine, hasResults, scopeOpen } = view;

  // Ownership first. The other page's load still running in the slice is not
  // this page's spinner — checking loading first showed LP's progress under
  // Coupon Sales until the claim landed.
  const screen =
    mine && perf.loading
      ? "loading"
      : !hasResults || perf.searchOpen
        ? "search"
        : perf.detailOpen && (scopeOpen || perf.selectedStoreKey)
          ? "detail"
          : "list";

  return (
    <EventPerfCtx.Provider value={{ ...view, typePickerOpen, setTypePickerOpen }}>
      {screen === "loading" ? (
        <EventLoading />
      ) : screen === "search" ? (
        <EventSearchScreen title={title} description={description} buttonLabel={buttonLabel} />
      ) : screen === "detail" ? (
        <EventDetailScreen title={title} measure={measure} />
      ) : (
        <EventListScreen
          allLabel={allLabel}
          measure={measure}
          helpPage={helpPage}
          storeFilter={storeFilter}
          setStoreFilter={setStoreFilter}
        />
      )}
    </EventPerfCtx.Provider>
  );
};

export default EventPerfMobile;
