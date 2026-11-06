const Header = () => {
  return (
    <thead>
      <tr className="sticky top-0 bg-gray-50 border-b border-gray-100 z-10">
        <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-content/85">
          #
        </th>
        <th className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-content/85">
          UPC
        </th>
        <th
          className="text-left px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-content/85"
          style={{ width: "22%" }}
        >
          Description
        </th>
        <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-content/85">
          Cases
        </th>
        <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-content/85">
          Units
        </th>
        <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-content/85 whitespace-nowrap">
          U Cost
        </th>
        <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-content/85 whitespace-nowrap">
          Ext Cost
        </th>
        <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-content/85">
          Retail
        </th>
        <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-content/85 whitespace-nowrap">
          Ext Retail
        </th>
        <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-content/85">
          GM
        </th>
        <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-content/85">
          Free
        </th>
        <th className="text-right px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-content/85">
          Return
        </th>
      </tr>
    </thead>
  );
};

export default Header;
