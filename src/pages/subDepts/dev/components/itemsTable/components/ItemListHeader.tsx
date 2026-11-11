// Hooks
import { useState } from "react";

// Utils
import { colInputStyle } from "../utils";

// Interfaces
import type { ColSort } from "../interfaces";

// Components
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid";
import ColFilter from "./ColFilter";

interface ItemListHeaderProps {
  appliedUpc: string;
  onUpc: (v: string) => void;
  appliedDesc: string;
  onDesc: (v: string) => void;
  colSort: ColSort;
  onColSort: (col: "ty" | "lw" | "ly") => void;
}

/**
 * The item list's header: Item with its UPC and description filters, then the
 * sortable TY / LW / LY columns. Right padding is 4px wider than the rows' to
 * match their reserved scrollbar gutter.
 */
const ItemListHeader = ({
  appliedUpc,
  onUpc,
  appliedDesc,
  onDesc,
  colSort,
  onColSort,
}: ItemListHeaderProps) => {
  // What is typed in each filter box, applied only on Apply.
  const [draftDesc, setDraftDesc] = useState("");
  const [draftUpc, setDraftUpc] = useState("");
  return (
    <div className="flex items-center gap-2.5 pl-3 pr-4 py-1.5 border-b border-line_hair flex-shrink-0">
      <span className="w-2.5 flex-shrink-0" />
      <span className="text-[11.5px] font-semibold uppercase tracking-wide text-content/95 flex-1 flex items-center gap-2 min-w-0">
        Item
        <ColFilter
          label="UPC"
          active={!!appliedUpc}
          onApply={() => onUpc(draftUpc)}
          onClear={() => {
            onUpc("");
            setDraftUpc("");
          }}
        >
          <input
            autoFocus
            style={colInputStyle}
            placeholder="Search UPC…"
            value={draftUpc}
            onChange={(e) => setDraftUpc(e.target.value)}
          />
        </ColFilter>
        <ColFilter
          label="Desc"
          active={!!appliedDesc}
          onApply={() => onDesc(draftDesc)}
          onClear={() => {
            onDesc("");
            setDraftDesc("");
          }}
        >
          <input
            autoFocus
            style={colInputStyle}
            placeholder="Search description…"
            value={draftDesc}
            onChange={(e) => setDraftDesc(e.target.value)}
          />
        </ColFilter>
      </span>
      <div className="flex items-center gap-[10px]">
        <button
          onClick={() => onColSort("ty")}
          className="flex items-center justify-center gap-0.5 text-[11.5px] font-semibold uppercase tracking-wide text-content/95 hover:text-content flex-shrink-0"
          style={{ width: 76 }}
        >
          TY
          {colSort?.col === "ty" &&
            (colSort.dir === "desc" ? (
              <ChevronDownIcon className="w-3 h-3" />
            ) : (
              <ChevronUpIcon className="w-3 h-3" />
            ))}
        </button>
        <button
          onClick={() => onColSort("lw")}
          className="flex items-center justify-center gap-0.5 text-[11.5px] font-semibold uppercase tracking-wide text-content/95 hover:text-content flex-shrink-0"
          style={{ width: 68 }}
        >
          LW
          {colSort?.col === "lw" &&
            (colSort.dir === "desc" ? (
              <ChevronDownIcon className="w-3 h-3" />
            ) : (
              <ChevronUpIcon className="w-3 h-3" />
            ))}
        </button>
        <button
          onClick={() => onColSort("ly")}
          className="flex items-center justify-center gap-0.5 text-[11.5px] font-semibold uppercase tracking-wide text-content/95 hover:text-content flex-shrink-0"
          style={{ width: 68 }}
        >
          LY
          {colSort?.col === "ly" &&
            (colSort.dir === "desc" ? (
              <ChevronDownIcon className="w-3 h-3" />
            ) : (
              <ChevronUpIcon className="w-3 h-3" />
            ))}
        </button>
      </div>
    </div>
  );
};

export default ItemListHeader;
