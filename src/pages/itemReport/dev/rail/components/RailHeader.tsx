// Interfaces
import type { ReportItem } from "../../interfaces";

// Components
import PageInfoButton from "../../../../../components-dev/PageInfoButton";

interface RailHeaderProps {
  item: ReportItem;
}

/** The rail's navy header: the item's description and UPC, and its own "?". */
const RailHeader = ({ item }: RailHeaderProps) => (
  <div className="flex-shrink-0 px-4 py-3 bg-brand_navy rounded-t-xl flex items-start gap-2">
    <div className="min-w-0 flex-1">
      <div className="text-[13px] cc-navy-title leading-tight">
        {item.description}
      </div>
      <div className="text-[12px] mt-0.5 text-custom-white/95 truncate">
        {item.productCode}
      </div>
    </div>
    {/* This panel gets its own glossary rather than sharing the list's.
        The sections here — estimated prices against actual registers,
        how a vendor billed a delivery, what the two modals show — are
        things the left panel's "?" was explaining from across the page,
        or not at all. */}
    <div className="relative flex-shrink-0">
      <PageInfoButton page="item-actions" />
    </div>
  </div>
);

export default RailHeader;
