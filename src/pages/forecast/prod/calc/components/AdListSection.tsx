// Utils
import { formatCurrency2 } from "../../../../../utils";
import { SECTION, SECTION_HEAD } from "../utils";

// Interfaces
import type { AdListData } from "../../../../../features/forecastDevSlice";

interface AdListSectionProps {
  ad: AdListData;
}

/** What the ad list says about the item: its feature, retail, cost and pack. */
const AdListSection = ({ ad }: AdListSectionProps) => (
  <div className={SECTION}>
    <div className={SECTION_HEAD}>Ad list</div>
    <div className="p-3 flex flex-col gap-1.5 text-[12px]">
      {ad.featureDescription && (
        <div className="font-medium text-content">
          {ad.featureDescription}
          {ad.pageName && (
            <span className="ml-1.5 text-content/95 font-normal">
              ({ad.pageName})
            </span>
          )}
        </div>
      )}
      {(
        [
          [
            "Ad retail",
            ad.adCount > 1
              ? `${ad.adCount}/${formatCurrency2(ad.adRetail)} (${formatCurrency2(ad.unitAdRetail)}/ea)`
              : formatCurrency2(ad.adRetail),
          ],
          ["Reg retail", formatCurrency2(ad.regularRetail)],
          ["Net unit cost", formatCurrency2(ad.netUnitCost)],
          ["Pack / size", `${ad.pack} / ${ad.size}`],
        ] as const
      ).map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between">
          <span className="font-medium text-content/95">{label}</span>
          <span className="font-medium tabular-nums text-content">{value}</span>
        </div>
      ))}
      {ad.featureNotes && (
        <div className="border-t border-line_hair pt-1.5 text-[11px] font-medium text-content/95">
          {ad.featureNotes}
        </div>
      )}
    </div>
  </div>
);

export default AdListSection;
