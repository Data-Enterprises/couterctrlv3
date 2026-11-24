// Interfaces
import type { Tab } from "../../interfaces";

interface DetailTabsProps {
  tab: Tab;
  onTab: (tab: Tab) => void;
  /** The category has no category at the POS, which the row says on the right. */
  uncategorized: boolean;
}

/** Items and Hours, with a note for an uncategorized bucket. */
const DetailTabs = ({ tab, onTab, uncategorized }: DetailTabsProps) => (
  <div className="flex items-center border-b border-line_hair px-3 flex-shrink-0">
    {(["items", "hours"] as const).map((k) => (
      <button
        key={k}
        onClick={() => onTab(k)}
        className={`px-3 py-2 text-[12px] font-medium border-b-2 transition-colors ${
          tab === k
            ? "border-brand_navy text-content"
            : "border-transparent text-content/95 hover:text-content/80"
        }`}
      >
        {k === "items" ? "Items" : "Hours"}
      </button>
    ))}
    <div className="flex-1" />
    {uncategorized && (
      <span className="text-[10px] text-content/95 pr-1">
        No category assigned at the POS
      </span>
    )}
  </div>
);

export default DetailTabs;
