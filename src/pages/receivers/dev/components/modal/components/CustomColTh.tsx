// Interfaces
import type { MappedColumn } from "../interfaces";

interface CustomColThProps {
  column: MappedColumn;
}

/** A column heading in the export modal's custom-mode preview table. */
const CustomColTh = ({ column }: CustomColThProps) => {
  return (
    <th className="cc-th text-content/95">
      {column.label}
    </th>
  );
};

export default CustomColTh;
