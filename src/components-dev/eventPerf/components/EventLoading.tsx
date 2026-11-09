// Hooks
import { useEventPerfCtx } from "../hooks";

// Components
import { TY_COLOR } from "../../mobile/perf/perfColors";

/** The load in progress, with the step it is on. */
const EventLoading = () => {
  const { perf } = useEventPerfCtx();
  return (
    <div className="flex h-[calc(100dvh-3rem)] items-center justify-center bg-bkg px-8 text-center">
      <div>
        <div
          className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-gray-200"
          style={{ borderTopColor: TY_COLOR }}
        />
        <div className="text-[12.5px] text-content/95">
          {perf.loadingMessage || "Loading..."}
        </div>
      </div>
    </div>
  );
};

export default EventLoading;
