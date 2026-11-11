/** The sticky column headings of the receiver line-item table. */
const Header = () => {
  return (
    <thead>
      <tr className="sticky top-0 bg-fill_soft border-b border-line_hair z-10">
        <th className="text-right px-3 py-2 text-[10px] cc-caps">
          #
        </th>
        <th className="text-left px-3 py-2 text-[10px] cc-caps">
          UPC
        </th>
        <th
          className="text-left px-3 py-2 text-[10px] cc-caps"
          style={{ width: "22%" }}
        >
          Description
        </th>
        <th className="text-right px-3 py-2 text-[10px] cc-caps">
          Cases
        </th>
        <th className="text-right px-3 py-2 text-[10px] cc-caps">
          Units
        </th>
        <th className="text-right px-3 py-2 text-[10px] cc-caps whitespace-nowrap">
          U Cost
        </th>
        <th className="text-right px-3 py-2 text-[10px] cc-caps whitespace-nowrap">
          Ext Cost
        </th>
        <th className="text-right px-3 py-2 text-[10px] cc-caps">
          Retail
        </th>
        <th className="text-right px-3 py-2 text-[10px] cc-caps whitespace-nowrap">
          Ext Retail
        </th>
        <th className="text-right px-3 py-2 text-[10px] cc-caps">
          GM
        </th>
        <th className="text-right px-3 py-2 text-[10px] cc-caps">
          Free
        </th>
        <th className="text-right px-3 py-2 text-[10px] cc-caps">
          Return
        </th>
      </tr>
    </thead>
  );
};

export default Header;
