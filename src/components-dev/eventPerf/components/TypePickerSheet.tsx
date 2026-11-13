// Hooks
import { useAppDispatch } from "../../../hooks";
import { useEventPerfCtx } from "../hooks";

// Redux
import { setEventLens } from "../../../features/dev/devEventPerfSlice";

// Utils
import { formatCurrency2 } from "../../../utils";
import { fmtInt } from "../utils/display";

// Components
import BottomSheet from "../../BottomSheet";

interface TypePickerSheetProps {
  allLabel: string;
  measure: "transactions" | "amount";
}

/** The type picker: every event type with its figures, so choosing is one
 *  tap from a menu that already says which is worst. */
const TypePickerSheet = ({ allLabel, measure }: TypePickerSheetProps) => {
  const dispatch = useAppDispatch();
  const { perf, pages, cardTotals, fmt, valueOf, setTypePickerOpen } = useEventPerfCtx();
  return (
    <BottomSheet onClose={() => setTypePickerOpen(false)}>
      <div className="px-4 pb-6 pt-1">
        <h2 className="font-display text-[15px] font-bold text-content">
          Type
        </h2>
        <p className="pb-2 pt-0.5 text-[12px] text-content/95">
          Scopes the whole screen, including the stores below.
        </p>
        {/* Each row carries its own figures, so the choice is made from the
            menu rather than by visiting every type to find out. */}
        {pages.map((lens, i) => {
          const t = cardTotals[i];
          const active = perf.lens === lens;
          return (
            <button
              key={lens ?? "__all"}
              type="button"
              aria-current={active ? "true" : undefined}
              onClick={() => {
                dispatch(setEventLens(lens));
                setTypePickerOpen(false);
              }}
              className={`flex w-full items-baseline gap-3 border-t border-brand_line px-1 py-3 text-left first:border-t-0 ${
                active ? "bg-row_selected" : "active:bg-bkg"
              }`}
            >
              <span className="min-w-0 flex-1 truncate font-display text-[13.5px] font-semibold text-content">
                {lens ?? allLabel}
              </span>
              <span className="flex-none text-[12px] text-content/95">
                {measure === "amount"
                  ? `${fmtInt(t.transactions)} txns`
                  : formatCurrency2(t.amount)}
              </span>
              <span className="flex-none font-display text-[13.5px] font-bold text-content">
                {fmt(valueOf(t))}
              </span>
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
};

export default TypePickerSheet;
