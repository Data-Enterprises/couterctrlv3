// Interfaces
import type { MappedColumn } from "../interfaces";

/** A column heading in the export modal's custom-mode preview table. */
const CustomColTh = ({ column }: { column: MappedColumn }) => {
  return (
    <th className="text-left px-3 py-2 text-content/55 font-semibold border-b border-gray-100 whitespace-nowrap">
      {column.label}
    </th>
  );
};

export default CustomColTh;
