import { useAppSelector } from "../../../hooks";
import { AgGridReact } from "ag-grid-react";
import { theme, subCols } from "../graphs";
ModuleRegistry.registerModules([AllCommunityModule]);
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import type { SubSale } from "../../../interfaces";

const SubDeptGrid = () => {
  const {subSales} = useAppSelector((state) => state.sales);

  const groupSubs = () => {
    return [...subSales].reduce((acc: SubSale[], curr) => {
      const exists = acc.find((d) => d.sub_department === curr.sub_department);
      if (exists) {
        exists.total_sales += curr.total_sales;
        exists.net_sales += curr.net_sales;
        exists.qty += curr.qty;
        exists.digital_coupons += curr.digital_coupons;
        exists.elec_instore_coupons += curr.elec_instore_coupons;
        exists.elec_store_coupons += curr.elec_store_coupons;
        exists.store_coupon += curr.store_coupon;
        exists.weight += curr.weight;
        exists.total_tax += curr.total_tax;
      } else {
        acc.push({ ...curr });
      } 
      return acc;
    }, []);
  };

  return (
    <div className="bg-custom-white rounded-lg shadow-lg pb-2 pt-1">
      <div className="px-2 flex justify-between items-center">
        <span className="font-medium">Sub Department Sales</span>
      </div>
      <div className="px-2 h-[92%]">
        <AgGridReact rowData={groupSubs()} theme={theme} columnDefs={subCols} pagination={true} paginationAutoPageSize={true} />
      </div>
    </div>
  );
};

export default SubDeptGrid;
