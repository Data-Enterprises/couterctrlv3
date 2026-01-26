import { useAppSelector } from "../../../hooks";
import SubCompCard from "./SubCompCard";

const SubDeptComps = () => {
  const { subSales, compareSubs, selectedSalesPanel, compareSalesPanel } =
    useAppSelector((state) => state.sales);

  // Step One
  if (selectedSalesPanel.storeid === 0 && compareSubs.length === 0) {
    return (
      <div className="bg-custom-white rounded-lg shadow-lg flex justify-center items-center">
        Select a Sales Panel
      </div>
    );

    // Step Two
  } else if (compareSubs.length === 0) {
    return (
      <div className="bg-custom-white rounded-lg shadow-lg flex justify-center items-center">
        Click "Compare Subs" on another sales panel to see comparisons
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const dte = dateStr.split("T")[0].split("-");
    return `${parseInt(dte[1])}/${parseInt(dte[2])}/${parseInt(dte[0])}`;
  };

  const filteredSubs = subSales.filter((sub) =>
    compareSubs.some(
      (compSub) =>
        compSub.sub_department === sub.sub_department &&
        formatDate(sub.sale_date) ===
          formatDate(selectedSalesPanel.sale_date) &&
        formatDate(sub.sale_date) === formatDate(compSub.sale_date),
    ),
  );

  const filteredComps = compareSubs.filter((compSub) =>
    subSales.some(
      (sub) =>
        sub.sub_department === compSub.sub_department &&
        formatDate(compSub.sale_date) ===
          formatDate(compareSalesPanel.sale_date) &&
        formatDate(compSub.sale_date) === formatDate(sub.sale_date),
    ),
  );

  // Once we have both data sets, show the comparisons (final step)
  return (
    <div className="bg-custom-white rounded-lg shadow-lg px-2 pt-1 pb-2">
      <div className="grid grid-cols-2">
        <div className="font-medium">
          Compare Panel: {compareSalesPanel.store_name}
        </div>
        <div className="font-medium">
          Selected Panel: {selectedSalesPanel.store_name}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 max-h-[275px] overflow-y-scroll no-scrollbar">
        {/* Selected Sales Panel */}
        <div className="space-y-3">
          {filteredSubs.map((sub) => (
            <SubCompCard key={Math.random()} sub={sub} />
          ))}
        </div>

        {/* Compare Sales Panel */}
        <div className="space-y-3">
          {filteredComps.map((sub) => (
            <SubCompCard key={Math.random()} sub={sub} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubDeptComps;
