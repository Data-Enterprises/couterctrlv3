// Utils
import { OPTIONS } from "../utils";

// Interfaces
import type { GrantMode } from "../../../../../../interfaces";

// Components
import GrantModeChip from "./GrantModeChip";

/**
 * How this person gets stores, asked before any store is picked: each card
 * states the consequence ("New stores: show up automatically" or "must be added
 * by hand").
 *
 * **It is the person's answer, not a default:** every group they hold is
 * written in this mode. In Edit, changing it rewrites every held group;
 * switching to By store starts with every current store ticked, and the review
 * step says so before saving.
 *
 * For the single-store role, By group is shown greyed with its reason, never
 * hidden.
 */
const StepAccessType = ({
  value,
  onChange,
  who,
  singleStoreOnly,
  editing = false,
  typeUnset = false,
}: {
  value: GrantMode;
  onChange: (next: GrantMode) => void;
  /** The person being created, so the question names them. */
  who: string;
  /** The single-store role can't hold a whole group (the server refuses), so
   *  By group is greyed with its reason. */
  singleStoreOnly: boolean;
  /** An existing person, whose access type is a change rather than a first
   *  answer. Only the sentence under the heading differs. */
  editing?: boolean;
  /** Editing somebody with no access type on file — made in prod, or before
   *  types existed. The choice here is a first answer, and saving records it. */
  typeUnset?: boolean;
}) => (
  <div className="max-w-[900px] mx-auto">
    <h2 className="text-[17px] font-bold text-content m-0">
      How should {who || "this user"} get their stores?
    </h2>
    <p className="text-[12.5px] text-content/95 mt-1 mb-4">
      {typeUnset
        ? "No access type is set for this user yet. Pick one and save to set it for every base group they hold."
        : editing
          ? "Changing this rewrites every base group they hold. Switching to By store starts with all their current stores ticked."
          : "You can change this later by editing them."}
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
              // Greyed by fading the parts, not the card: the reason is
              // the one thing on it worth reading, so it keeps full contrast.
              disabled
                ? "bg-bkg shadow-card-sm cursor-not-allowed"
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
                <div
                  className={`flex items-center justify-between gap-2 ${
                    disabled ? "opacity-50" : ""
                  }`}
                >
                  <span className="text-[15px] font-bold text-content">
                    {opt.title}
                  </span>
                  <GrantModeChip mode={opt.mode} />
                </div>
                <p className="text-[12.5px] text-content/95 leading-snug mt-1.5">
                  {disabled
                    ? "Not available for the single store role. A single-store account holds exactly one store, and a whole group grants every store in it, including ones added later."
                    : opt.desc}
                </p>
              </div>
            </div>

            <dl
              className={`grid grid-cols-[96px_minmax(0,1fr)] gap-y-2 gap-x-3 text-[12px] mt-4 pt-3.5 pl-[30px] border-t border-gray-100 ${
                disabled ? "opacity-50" : ""
              }`}
            >
              <dt className="text-content/95">New stores</dt>
              <dd className="m-0 font-semibold text-content">
                {opt.newStores}
              </dd>
              <dt className="text-content/95">You'll pick</dt>
              <dd className="m-0 font-semibold text-content">{opt.pick}</dd>
              <dt className="text-content/95">Best for</dt>
              <dd className="m-0 text-content">{opt.best}</dd>
            </dl>
          </button>
        );
      })}
    </div>

  </div>
);

export default StepAccessType;
