// Interfaces
import type { MappedColumn } from "../interfaces";

const CustomColTh = ({ column }: { column: MappedColumn }) => {
  return (
    <th className="text-left px-3 py-2 text-content/55 font-semibold border-b border-gray-100 whitespace-nowrap">
      {column.label}
    </th>
  );
};

export default CustomColTh;
