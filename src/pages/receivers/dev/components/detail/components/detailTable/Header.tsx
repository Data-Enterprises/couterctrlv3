/** The sticky column headings of the receiver line-item table. */
const Header = () => {
  return (
    <thead>
      <tr className="sticky top-0 bg-gray-50 border-b border-line_hair z-10">
        <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-content/95">
          #
        </th>
        <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-content/95">
          UPC
        </th>
        <th
          className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-content/95"
          style={{ width: "22%" }}
        >
          Description
        </th>
        <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-content/95">
          Cases
        </th>
        <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-content/95">
          Units
        </th>
        <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-content/95 whitespace-nowrap">
          U Cost
        </th>
        <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-content/95 whitespace-nowrap">
          Ext Cost
        </th>
        <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-content/95">
          Retail
        </th>
        <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-content/95 whitespace-nowrap">
          Ext Retail
        </th>
        <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-content/95">
          GM
        </th>
        <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-content/95">
          Free
        </th>
        <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-content/95">
          Return
        </th>
      </tr>
    </thead>
  );
};

export default Header;
