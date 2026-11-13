// Interfaces
import type { BarList } from "../interfaces";

// Components
import ListBadge from "../../components/ListBadge";

interface CompareBarListProps {
  list: BarList;
}

/** One list in the compare bar, as a pill: its badge and name, its size, and
 *  how many of its items have not sold since last year. */
const CompareBarList = ({ list }: CompareBarListProps) => (
  <span className="flex items-center gap-2 min-w-0 pl-1 pr-1.5 py-1 rounded-full border border-line_field bg-custom-white whitespace-nowrap">
    <ListBadge side={list.side} />
    <span className="truncate text-[13px] font-bold text-content">{list.name}</span>
    <span className="text-[11.5px] text-content">{list.items}</span>
    <span className="px-2 py-0.5 rounded-full bg-fill_muted text-[11px] font-medium text-content">{list.gone}</span>
  </span>
);

export default CompareBarList;
