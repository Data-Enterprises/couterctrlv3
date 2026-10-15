import type { GrantMode } from "../../../../../interfaces";
import GrantModeChip from "../access/GrantModeChip";

/**
 * How this person gets stores, before any store is picked.
 *
 * The question used to be invisible: every group was handed over as a fixed
 * list, so "will this person see the next store we open" had one answer and
 * nobody chose it. It is asked first now, because it is the thing that is
 * hard to notice later — a fixed grant looks exactly like an auto one until a
 * store is added and somebody cannot see it.
 *
 * Each card states the consequence rather than describing the setting. "New
 * stores: show up automatically" against "must be added by hand" is the whole
 * difference, and it is what somebody is actually choosing between.
 *
 * This sets the **default** for each group as it is picked; the assignments
 * step still lets one group differ, which is the common real case — the whole
 * of East, plus two stores out of HC North.
 */
const OPTIONS: {
  mode: GrantMode;
  title: string;
  desc: string;
  newStores: string;
  pick: string;
  best: string;
}[] = [
  {
    mode: "all",
    title: "By group",
    desc: "They see every store in the base groups you pick.",
    newStores: "Show up automatically",
    pick: "Base groups",
    best: "Managers, buyers, corporate",
  },
  {
    mode: "selected",
    title: "By store",
    desc: "They see only the stores you pick, nothing more.",
    newStores: "Must be added by hand",
    pick: "Individual stores",
    best: "Single store, small multi-store",
  },
];

const StepAccessType = ({
  value,
  onChange,
  who,
  singleStoreOnly,
}: {
  value: GrantMode;
  onChange: (next: GrantMode) => void;
  /** The person being created, so the question names them. */
  who: string;
  /** The single-store role cannot hold a whole group — the server refuses it
   *  outright — so By group is not offered rather than offered and rejected. */
  singleStoreOnly: boolean;
}) => (
  <div className="max-w-[900px] mx-auto">
    <h2 className="text-[17px] font-bold text-content m-0">
      How should {who || "this user"} get their stores?
    </h2>
    <p className="text-[12.5px] text-content/85 mt-1 mb-4">
      You can change this later from their Access tab.
    </p>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {OPTIONS.map((opt) => {
        const disabled = singleStoreOnly && opt.mode === "all";
        const selected = value === opt.mode;
        return (
          <button
            key={opt.mode}
            onClick={() => !disabled && onChange(opt.mode)}
            disabled={disabled}
            aria-pressed={selected}
            className={`text-left rounded-xl p-5 transition-colors bg-custom-white ${
              disabled
                ? "shadow-card-sm opacity-50 cursor-not-allowed"
                : selected
                  ? "shadow-card ring-2 ring-brand_navy"
                  : "shadow-card-sm hover:bg-brand_paper"
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={`w-[18px] h-[18px] rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                  selected ? "border-brand_navy" : "border-brand_line_2"
                }`}
              >
                {selected && (
                  <span className="w-2.5 h-2.5 rounded-full bg-brand_navy" />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[15px] font-bold text-content">
                    {opt.title}
                  </span>
                  <GrantModeChip mode={opt.mode} />
                </div>
                <p className="text-[12.5px] text-content/85 leading-snug mt-1.5">
                  {opt.desc}
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-[96px_minmax(0,1fr)] gap-y-2 gap-x-3 text-[12px] mt-4 pt-3.5 pl-[30px] border-t border-gray-100">
              <dt className="text-content/85">New stores</dt>
              <dd className="m-0 font-semibold text-content">
                {opt.newStores}
              </dd>
              <dt className="text-content/85">You'll pick</dt>
              <dd className="m-0 font-semibold text-content">{opt.pick}</dd>
              <dt className="text-content/85">Best for</dt>
              <dd className="m-0 text-content">{opt.best}</dd>
            </dl>
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
