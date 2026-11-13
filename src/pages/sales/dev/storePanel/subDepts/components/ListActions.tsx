// Hooks
import { useEffect, useState } from "react";

// Utils
import { copyToClipboard } from "../../../../../../components-dev/utils";
import { LIST_ACTION_BTN } from "../utils";

// Components
import { XMarkIcon } from "@heroicons/react/20/solid";
import ListBadge from "./ListBadge";

interface ListActionsProps {
  /** The UPCs the filters leave on screen. */
  shownUpcs: string[];
  /** The pinned list's name and count, or null with nothing pinned. */
  pinned: { label: string; count: number } | null;
  /** False while the filters still show the pinned list. */
  canCompare: boolean;
  onPin: () => void;
  onUnpin: () => void;
  onCompare: () => void;
}

/** Under the item filters: the pinned list (A), copy the UPCs shown, and
 *  Compare, which pins this list as A or, with one pinned, opens the panel. */
const ListActions = ({ shownUpcs, pinned, canCompare, onPin, onUnpin, onCompare }: ListActionsProps) => {
  const [copied, setCopied] = useState(false);

  // The "Copied" label goes back after a moment.
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <div className="flex items-center gap-1.5 px-3 py-1 bg-fill_muted border-b border-line_hair flex-shrink-0">
      {pinned && (
        <span
          data-help="compare-pinned"
          className="flex items-center gap-1 min-w-0 pl-0.5 pr-1 py-0.5 rounded-full border border-brand_navy/35 bg-custom-white"
        >
          <ListBadge side="A" />
          <span className="truncate text-[11px] font-semibold text-content">
            {pinned.label} | {pinned.count.toLocaleString()} item{pinned.count === 1 ? "" : "s"}
          </span>
          <button onClick={onUnpin} title="Drop list A" aria-label="Drop list A" className="cc-muted-link">
            <XMarkIcon className="w-3 h-3" />
          </button>
        </span>
      )}
      <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
        <button
          data-help="copy-shown"
          disabled={shownUpcs.length === 0}
          onClick={() => {
            copyToClipboard(shownUpcs);
            setCopied(true);
          }}
          title="Copy the UPCs of the items listed below, separated by commas"
          className={LIST_ACTION_BTN}
        >
          {copied ? "Copied" : `Copy ${shownUpcs.length.toLocaleString()} UPC${shownUpcs.length === 1 ? "" : "s"}`}
        </button>
        {pinned ? (
          <button
            data-help="compare"
            disabled={!canCompare}
            onClick={onCompare}
            title={canCompare ? "Compare list A with the items listed below" : "Change the filters to make a second list"}
            className="cc-btn-primary px-2.5 py-0.5 text-[11px]"
          >
            Compare with A
          </button>
        ) : (
          <button
            data-help="compare"
            onClick={onPin}
            title="Keep this list as A, then change the filters to compare it with another"
            className={LIST_ACTION_BTN}
          >
            Compare
          </button>
        )}
      </div>
    </div>
  );
};

export default ListActions;
