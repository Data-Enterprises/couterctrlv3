// Utils
import { hasSaleTypeBreakdown } from "../../utils";

// Interfaces
import type { SaleTypeSummary } from "../../../../../features/dev/devItemLookupSlice";

// Components
import BackButton from "../../../../../components-dev/BackButton";
import LocationTabs from "../../../../../components-dev/filters/LocationTabs";
import InfoButton from "../../../../../components-dev/InfoButton";
import SaleTypeRow from "./SaleTypeRow";

interface ReportHeaderCardProps {
  description: string;
  productCode: string;
  categoryDescription: string;
  storeName: string;
  dateRangeLabel: string;
  storeNumbers: string[];
  selectedStoreNumber: string | null;
  onStoreNumberChange: (storeNumber: string | null) => void;
  onBack: () => void;
  onInfo: () => void;
  saleTypes: SaleTypeSummary[];
  selectedSaleType: string;
  weighed: boolean;
  onPickSaleType: (type: string) => void;
}

/** The phone report's first card: the item, its store and window, back and
 *  "?", the location tabs, and the sale types to read it through. */
const ReportHeaderCard = ({
  description,
  productCode,
  categoryDescription,
  storeName,
  dateRangeLabel,
  storeNumbers,
  selectedStoreNumber,
  onStoreNumberChange,
  onBack,
  onInfo,
  saleTypes,
  selectedSaleType,
  weighed,
  onPickSaleType,
}: ReportHeaderCardProps) => {
  const saleDollars = saleTypes.find((t) => t.saleType === "Sale")?.sales ?? 0;

  return (
    <section data-testid="lookup-header" className="cc-card-phone">
      {/* One block: the item is the title, the store and window qualify
          it, and the page's controls live on this card. */}
      <div className="flex items-start gap-2 border-b border-line_hair px-3.5 py-2.5">
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[15px] font-bold leading-tight text-content">
            {description}
          </div>
          <div className="mt-0.5 truncate text-[11px] cc-caps">
            {productCode}
            {categoryDescription ? ` · ${categoryDescription}` : ""}
          </div>
          {/* The window as small print: the chart already draws it. */}
          <div className="mt-1 truncate text-[11px] font-semibold text-content/95">
            {storeName} &middot; {dateRangeLabel}
          </div>
        </div>
        {/* Search and "?" together in the corner, as MobilePerfCard does:
            search leads back to the search card and its recent lookups. */}
        <div className="flex flex-none items-center gap-1.5">
          <BackButton onClick={onBack} tone="light" />
          <InfoButton
            variant="light"
            onClick={onInfo}
            title="What this page shows"
            className="-mr-1"
          />
        </div>
      </div>

      {storeNumbers.length > 1 && (
        <div className="border-b border-line_hair">
          <LocationTabs
            numbers={storeNumbers}
            selected={selectedStoreNumber}
            onChange={onStoreNumberChange}
            variant="bare"
          />
        </div>
      )}
      {hasSaleTypeBreakdown(saleTypes) && (
        <div
          data-testid="lookup-sale-types"
          className="border-t border-line_hair"
        >
          {/* A caption, not a heading: the item is the card's title. */}
          <div className="px-3.5 pb-1.5 pt-2.5">
            <span className="text-[9.5px] font-semibold uppercase tracking-wider text-content/95">
              By sale type
            </span>
          </div>
          <div>
            {saleTypes.map((s) => {
              const isSelected = s.saleType === selectedSaleType;
              return (
                <SaleTypeRow
                  key={s.saleType}
                  saleType={s}
                  isSelected={isSelected}
                  weighed={weighed}
                  saleDollars={saleDollars}
                  onPick={() =>
                    onPickSaleType(
                      isSelected && s.saleType !== "Sale" ? "Sale" : s.saleType,
                    )
                  }
                />
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

export default ReportHeaderCard;
