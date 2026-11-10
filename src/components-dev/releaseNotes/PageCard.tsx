// Interfaces
import type { ReleasePage } from "../../content/releaseNotes";

// Components
import PageTitle from "./PageTitle";
import Bullets from "./Bullets";

interface PageCardProps {
  p: ReleasePage;
  mine: boolean;
}

/** One page's changes, highlighted when it is the page the reader is on. */
const PageCard = ({ p, mine }: PageCardProps) => (
  <div
    data-this-page={mine}
    className={`rounded-xl border px-4 py-3 shadow-sm ${
      mine
        ? "border-row_selected_border bg-row_selected"
        : "border-brand_line bg-custom-white"
    }`}
  >
    <div className="mb-1.5 flex items-baseline gap-2 text-[13px]">
      <span className="min-w-0 flex-1">
        <PageTitle page={p.page} />
      </span>
      {mine && (
        <span className="flex-none rounded-full bg-brand_navy px-2 py-0.5 text-[10.5px] font-semibold text-custom-white">
          This page
        </span>
      )}
    </div>
    <Bullets items={p.bullets} />
  </div>
);

export default PageCard;
