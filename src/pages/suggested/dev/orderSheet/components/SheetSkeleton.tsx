// Utils
import { NAME_W } from "../../utils";

// Components
import Bar from "../../components/Bar";

interface SheetSkeletonProps {
  rows?: number;
}

/**
 * The right panel while a store's items are on the way.
 *
 * Keeps a band where the KPI tiles will be so the table does not slide up the
 * moment they render, then rows in the item grid's proportions.
 */
const SheetSkeleton = ({ rows = 12 }: SheetSkeletonProps) => (
  <div className="flex-1 overflow-hidden" role="status" aria-label="Loading the sheet">
    <div className="grid grid-cols-5 border-b border-line_hair bg-fill_soft">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className="px-6 py-3 border-r border-line_hair last:border-r-0 flex flex-col items-center gap-1.5"
        >
          <Bar w="55%" />
          <Bar w="75%" />
        </div>
      ))}
    </div>
    {Array.from({ length: rows }, (_, i) => (
      <div
        key={i}
        className="grid grid-cols-[1fr_128px_110px_130px] items-center gap-3 px-3 py-2.5 border-b border-brand_navy/10"
      >
        <Bar w={NAME_W[i % NAME_W.length]} />
        <Bar w="80%" />
        <div className="flex justify-end">
          <Bar w="60%" />
        </div>
        <div className="flex justify-end">
          <Bar w="70%" />
        </div>
      </div>
    ))}
  </div>
);

export default SheetSkeleton;
