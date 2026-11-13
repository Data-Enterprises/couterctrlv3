// Interfaces
import type { Side } from "../../interfaces";

// Components
import ListBadge from "../../components/ListBadge";

interface CompareListNameProps {
  side: Side;
  name: string;
  meta: string;
}

/** One list in the drawer's header: its badge, its name and what else it is. */
const CompareListName = ({ side, name, meta }: CompareListNameProps) => (
  <div className="flex items-center gap-2.5 min-w-0">
    <ListBadge side={side} big onNavy />
    <div className="min-w-0">
      <div className="cc-navy-title truncate text-[16px]">{name}</div>
      <div className="truncate text-[11.5px] text-custom-white">{meta}</div>
    </div>
  </div>
);

export default CompareListName;
