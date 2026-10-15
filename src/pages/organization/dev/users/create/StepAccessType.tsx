import type { GrantMode } from "../../../../../interfaces";
import GrantModeChip from "../access/GrantModeChip";

/**
 * How this person gets stores, before any store is picked.
 *
 * The question used to be invisible: every group was handed over as a fixed
 * list of stores, so "will this person see the next store we open" had one
 * answer and nobody chose it. Now it is the first thing asked, because it is
 * the thing that is hard to notice later — a fixed grant looks exactly like an
 * auto one until a store is added and somebody cannot see it.
 *
 * This sets the **default** for each group as it is picked. The assignments
 * step still lets one group differ, which is the common real case: the whole
 * of East, plus two stores out of HC North.
 */
const OPTIONS: {
  mode: GrantMode;
  title: string;
  body: string;
  who: string;
}[] = [
  {
    mode: "all",
    title: "By group",
    body: "They see every store in the base groups you pick. Stores added to those groups later show up automatically.",
    who: "Managers, buyers, corporate",
  },
  {
    mode: "selected",
    title: "By store",
    body: "They see only the stores you pick. Nothing changes when new stores are added.",
    who: "Single store, small multi-store",
  },
];

const StepAccessType = ({
  value,
  onChange,
  singleStoreOnly,
}: {
  value: GrantMode;
  onChange: (next: GrantMode) => void;
  /** The single-store role cannot hold a whole group — the server refuses it
   *  outright — so By group is not offered rather than offered and rejected. */
  singleStoreOnly: boolean;
}) => (
  <div className="max-w-[760px]">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {OPTIONS.map((opt) => {
        const disabled = singleStoreOnly && opt.mode === "all";
        const selected = value === opt.mode;
        return (
          <button
            key={opt.mode}
            onClick={() => !disabled && onChange(opt.mode)}
            disabled={disabled}
            className={`text-left rounded-lg px-4 py-3.5 transition-colors ${
              disabled
                ? "bg-custom-white shadow-card-sm opacity-50 cursor-not-allowed"
                : selected
                  ? "bg-custom-white shadow-card ring-2 ring-brand_navy"
                  : "bg-custom-white shadow-card-sm hover:bg-brand_paper"
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[14px] font-semibold text-content">
                {opt.title}
              </span>
              <GrantModeChip mode={opt.mode} />
            </div>
            <p className="text-[12px] text-content/85 leading-snug">
              {opt.body}
            </p>
            <p className="text-[11px] text-content/85 mt-2">{opt.who}</p>
          </button>
        );
      })}
    </div>

    {singleStoreOnly && (
      <p className="text-[11.5px] text-content/85 leading-snug mt-3 px-3 py-2 rounded-lg bg-bkg shadow-card-sm">
        <span className="font-semibold text-content">Single store role.</span>{" "}
        By group is unavailable: a whole group grants an unbounded number of
        stores and grows again every time one joins it. The next step allows
        exactly one store, and the server holds to that too.
      </p>
    )}
  </div>
);

export default StepAccessType;
