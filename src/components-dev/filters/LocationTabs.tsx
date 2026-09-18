/**
 * Location switcher for co-located stores — the handful of storeids that cover
 * two physical locations (see utils/storeIdentity).
 *
 * Single-store pages fetch by storeid, so those responses arrive with both
 * locations combined and something has to choose which one is on screen. List
 * pages don't need this: they just split into two rows.
 *
 * Renders nothing at all when there's fewer than two numbers, so call sites can
 * drop it in unconditionally and ordinary stores see no change to the layout.
 */
interface LocationTabsProps {
  /** Every store_number the current search returned. */
  numbers: string[];
  /** Which location is shown; null means all of them combined. */
  selected: string | null;
  onChange: (storeNumber: string | null) => void;
  /** Adds a trailing "Both" tab for the combined view. Default true. */
  includeCombined?: boolean;
  /** "panel" sits inside a bordered desktop panel; "bare" is full-bleed for
   *  mobile, where side borders would read as a stray inset. */
  variant?: "panel" | "bare";
}

const LocationTabs = ({
  numbers,
  selected,
  onChange,
  includeCombined = true,
  variant = "panel",
}: LocationTabsProps) => {
  if (numbers.length < 2) return null;

  const tabs: (string | null)[] = includeCombined
    ? [...numbers, null]
    : [...numbers];

  return (
    <div
      className={`flex items-center bg-custom-white border-b border-gray-100 ${
        variant === "panel" ? "border-x" : ""
      }`}
    >
      {tabs.map((num) => {
        const active = selected === num;
        return (
          <button
            key={num ?? "both"}
            onClick={() => onChange(num)}
            title={
              num
                ? `Location ${num}`
                : "Every location under this store id, combined"
            }
            className={`px-3 py-1.5 text-[12px] font-medium border-b-2 transition-colors ${
              active
                ? "border-[#1e2a4a] text-content"
                : "border-transparent text-content/60 hover:text-content"
            }`}
          >
            {num ?? "Both"}
          </button>
        );
      })}
    </div>
  );
};

export default LocationTabs;
