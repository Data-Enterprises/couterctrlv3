// Interfaces
import type { Side } from "../../interfaces";

// Components
import ListBadge from "../../components/ListBadge";

interface CompareListNameProps {
  side: Side;
  name: string;
  count: number;
}

/** One list in the navy header: its badge, its name and its count. */
const CompareListName = ({ side, name, count }: CompareListNameProps) => (
  <span className="flex items-center gap-2 min-w-0" title={`${count.toLocaleString()} items`}>
    <ListBadge side={side} onNavy />
    <span className="cc-navy-title truncate text-[15px] font-bold">{name}</span>
    <span className="text-[12px] text-custom-white flex-shrink-0">{count.toLocaleString()}</span>
  </span>
);

export default CompareListName;
