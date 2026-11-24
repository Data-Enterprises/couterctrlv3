// Interfaces
import type { ListFilter } from "../../utils/sources";
import type { ExportListItem } from "../../../../../features/dev/devExportBuilderSlice";

interface ChoiceLabelProps {
  list: ListFilter;
  item: ExportListItem;
}

/** How one choice in a list reads, by the list's look: an id and name, a name,
 *  a code and name, or the label with the list's hint for a blank value. */
const ChoiceLabel = ({ list, item }: ChoiceLabelProps) => {
  switch (list.look) {
    case "idName":
      return (
        <span className="flex items-center gap-2 min-w-0">
          <span className="font-medium">{item.value}</span>
          <span className="truncate text-content/95">{item.label}</span>
        </span>
      );
    case "name":
      return <span className="truncate">{item.label || item.value}</span>;
    case "codeName":
      return (
        <span className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-[11.5px] text-content/95">
            {item.value}
          </span>
          <span className="truncate">{item.label || "—"}</span>
        </span>
      );
    default:
      return list.blankHint && item.value === "" ? (
        <span className="flex items-center gap-1.5">
          {item.label}
          <span className="text-[11px] text-content/95">{list.blankHint}</span>
        </span>
      ) : (
        <>{item.label}</>
      );
  }
};

export default ChoiceLabel;
