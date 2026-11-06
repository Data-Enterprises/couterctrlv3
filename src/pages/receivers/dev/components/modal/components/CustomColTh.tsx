// Interfaces
import type { MappedColumn } from "../interfaces";

const CustomColTh = ({ column }: { column: MappedColumn }) => {
  return (
    <th className="text-left text-[12px] text-content/45 px-2 py-1">
      {column.label}
    </th>
  );
};

export default CustomColTh;
