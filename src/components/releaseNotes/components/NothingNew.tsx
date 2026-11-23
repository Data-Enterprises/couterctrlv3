// Interfaces
import type { Release } from "../../../content/releaseNotes";

interface NothingNewProps {
  pageName: string;
  /** The newest release that did touch the page, if any. */
  last: Release | undefined;
  onPick: (date: string) => void;
}

/** Said rather than left to be inferred: the panel opened from a page, so a
 *  release that does not touch it says so, with a way to the one that did. */
const NothingNew = ({ pageName, last, onPick }: NothingNewProps) => (
  <p className="m-0 flex-none rounded-xl border border-brand_line bg-custom-white px-3.5 py-2.5 text-[13px] text-content">
    Nothing new on {pageName} this release.
    {last ? (
      <>
        {" "}
        <button
          type="button"
          onClick={() => onPick(last.date)}
          className="font-medium text-brand_navy underline underline-offset-2 hover:text-brand_navy_hover"
        >
          Last changed {last.dateText}
        </button>
      </>
    ) : null}
  </p>
);

export default NothingNew;
