// Components
import BottomSheet from "../../../../../components/BottomSheet";

interface ExceptionPickerSheetProps {
  /** Exception types this store/week actually returned. */
  saleTypes: string[];
  current: string;
  onPick: (saleType: string) => void;
  onClose: () => void;
}

/** The phone's exception picker: a sheet listing the exceptions found, the
 *  current one marked. */
const ExceptionPickerSheet = ({
  saleTypes,
  current,
  onPick,
  onClose,
}: ExceptionPickerSheetProps) => (
  <BottomSheet onClose={onClose}>
    <div className="px-4 pb-6 pt-1">
      <h2 className="font-display text-[15px] font-bold text-content">
        Exception
      </h2>
      <p className="pb-2 pt-0.5 text-[12px] text-content/95">
        Scopes the whole screen, including the signals below.
      </p>
      {saleTypes.map((t) => (
        <button
          key={t}
          type="button"
          aria-current={t === current ? "true" : undefined}
          onClick={() => onPick(t)}
          className={`flex w-full items-baseline gap-3 border-t border-brand_line px-1 py-3 text-left first:border-t-0 ${
            t === current ? "bg-row_selected" : "active:bg-bkg"
          }`}
        >
          <span className="min-w-0 flex-1 truncate font-display text-[13.5px] font-semibold text-content">
            {t}
          </span>
        </button>
      ))}
    </div>
  </BottomSheet>
);

export default ExceptionPickerSheet;
