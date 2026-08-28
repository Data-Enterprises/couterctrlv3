import { useAppDispatch, useAppSelector } from "../../../hooks";
import { setLpCardSort } from "../../../features/lpActionsSlice";
import type { LpCardSort } from "../../../features/lpActionsSlice";

/**
 * Which question the card order answers.
 *
 * Deviation is the default because it is the one the page exists for: what
 * changed. Volume and value are there because the biggest mover is not always
 * the biggest problem — a 3.3× on nineteen cancels and a 1.2× on four hundred
 * voids are both worth someone's morning, for different reasons.
 */
const OPTIONS: { key: LpCardSort; label: string }[] = [
  { key: "deviation", label: "Deviation" },
  { key: "volume", label: "Volume" },
  { key: "value", label: "$ exposure" },
];

const CardSortToggle = () => {
  const dispatch = useAppDispatch();
  const cardSort = useAppSelector((s) => s.lpActions.cardSort);

  return (
    <div
      role="group"
      aria-label="Order the exception cards"
      className="inline-flex rounded overflow-hidden border border-gray-200"
    >
      {OPTIONS.map(({ key, label }) => (
        <button
          key={key}
          aria-pressed={cardSort === key}
          onClick={() => dispatch(setLpCardSort(key))}
          className={`px-2.5 py-1 text-[12px] border-r border-gray-200 last:border-r-0 transition-colors ${
            cardSort === key
              ? "bg-[#1e2a4a] text-custom-white"
              : "text-content/85 hover:bg-gray-50"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default CardSortToggle;
