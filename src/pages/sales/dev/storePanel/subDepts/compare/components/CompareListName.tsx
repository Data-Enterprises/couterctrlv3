// Interfaces
import type { Side } from "../../interfaces";

// Components
import ListBadge from "../../components/ListBadge";

interface CompareListNameProps {
  side: Side;
  name: string;
  count: number;
}

/** One list in the compare bar: its badge, its name and its count. */
const CompareListName = ({ side, name, count }: CompareListNameProps) => (
  <span className="flex items-center gap-2 min-w-0" title={`${count.toLocaleString()} items`}>
    <ListBadge side={side} large />
    <span className="truncate text-[15px] font-bold text-content">{name}</span>
    <span className="text-[12px] text-content flex-shrink-0">{count.toLocaleString()}</span>
  </span>
);

export default CompareListName;
