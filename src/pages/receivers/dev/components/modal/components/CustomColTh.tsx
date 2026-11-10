// Interfaces
import type { MappedColumn } from "../interfaces";

interface CustomColThProps {
  column: MappedColumn;
}

/** A column heading in the export modal's custom-mode preview table. */
const CustomColTh = ({ column }: CustomColThProps) => {
  return (
    <th className="text-left px-3 py-2 text-content/95 font-semibold border-b border-gray-100 whitespace-nowrap">
      {column.label}
    </th>
  );
};

export default CustomColTh;
