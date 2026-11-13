// Hooks
import { useEffect, useState } from "react";

// Utils
import { copyToClipboard } from "../../../../../../components-dev/utils";
import { LIST_ACTION_BTN } from "../utils";

interface ListActionsProps {
  /** The UPCs the filters leave on screen. */
  shownUpcs: string[];
}

/** Under the item filters, while they narrow the list: copy the UPCs shown. */
const ListActions = ({ shownUpcs }: ListActionsProps) => {
  const [copied, setCopied] = useState(false);

  // The "Copied" label goes back after a moment.
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <div className="flex items-center justify-end gap-1.5 px-3 py-1 bg-fill_muted border-b border-line_hair flex-shrink-0">
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
    </div>
  );
};

export default ListActions;
