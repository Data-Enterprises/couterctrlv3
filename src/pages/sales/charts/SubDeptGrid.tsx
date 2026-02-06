import { useAppSelector, useAppDispatch } from "../../../hooks";
import { AgGridReact } from "ag-grid-react";
import { theme, subCols, type TopSub } from "../components";
ModuleRegistry.registerModules([AllCommunityModule]);
import {
  AllCommunityModule,
  ModuleRegistry,
  type RowClickedEvent,
} from "ag-grid-community";
import type { SubSale } from "../../../interfaces";
import { setSelectedSubDept } from "../../../features/salesSlice";
import { useState, useEffect, useRef } from "react";
import SingleSelect from "../../../components/SingleSelect";

const SubDeptGrid = () => {
  const { isMobile } = useAppSelector((state) => state.app);
  const gridRef = useRef<AgGridReact<SubSale>>(null);
  const dispatch = useAppDispatch();
  const { subSales, selectedSubDept, topSubDept, selectedSalesPanel } =
    useAppSelector((state) => state.sales);
  const [groupSubs, setGroupSubs] = useState<SubSale[]>([]);

  useEffect(() => {
    const grouped = () => {
      return [...subSales].reduce((acc: SubSale[], curr) => {
        const exists = acc.find(
          (d) => d.sub_department === curr.sub_department,
        );
        if (exists) {
          exists.total_sales += curr.total_sales - curr.total_tax;
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
    setGroupSubs(grouped());
  }, [subSales]);

  const handleSetSelectedSubDept = (d: RowClickedEvent<SubSale>) => {
    const selected: TopSub = {
      sub_department: d.data!.sub_department,
      sub_department_description: d.data!.sub_department_description,
      total_sales: d.data!.total_sales,
      net_sales: d.data!.net_sales,
      qty: d.data!.qty,
      digital_coupons: d.data!.digital_coupons,
      elec_instore_coupons: d.data!.elec_instore_coupons,
      elec_store_coupons: d.data!.elec_store_coupons,
      store_coupon: d.data!.store_coupon,
      total_tax: d.data!.total_tax,
    };
    dispatch(setSelectedSubDept(selected));
  };

  const style = isMobile
    ? "-mx-2"
    : "bg-custom-white rounded-lg shadow-lg pb-2 pt-1 h-full";

  const handleSelect = (subDept: string | number) => {
    const d = groupSubs.find((s) => s.sub_department === Number(subDept));
    const selected: TopSub = {
      sub_department: d!.sub_department,
      sub_department_description: d!.sub_department_description,
      total_sales: d!.total_sales,
      net_sales: d!.net_sales,
      qty: d!.qty,
      digital_coupons: d!.digital_coupons,
      elec_instore_coupons: d!.elec_instore_coupons,
      elec_store_coupons: d!.elec_store_coupons,
      store_coupon: d!.store_coupon,
      total_tax: d!.total_tax,
    };
    dispatch(setSelectedSubDept(selected));
  };

  return (
    <div className={style}>
      {!isMobile ? (
        <div className="px-2 flex justify-between items-center">
          <span className="font-medium">
            {selectedSalesPanel.sale_date ? "Daily" : "Weekly"} Sub Department
            Sales
          </span>
        </div>
      ) : (
        <div className="px-2 flex justify-between items-center">
          <SingleSelect
            data={groupSubs}
            displayKey="sub_department_description"
            valueKey="sub_department"
            label="Sub Department Sales"
            innerClass="py-1"
            className="w-full"
            defaultQuery={
              (topSubDept?.sub_department_description as string) || ""
            } // set default to top sub dept
            onSelect={handleSelect}
            id={1}
          />
        </div>
      )}
      {!isMobile && (
        <div className="px-2 h-[92%]">
          <AgGridReact
            ref={gridRef}
            rowData={groupSubs}
            theme={theme}
            columnDefs={subCols}
            pagination={true}
            paginationAutoPageSize={true}
            onRowClicked={(d) => {
              if (
                !selectedSubDept ||
                (selectedSubDept &&
                  selectedSubDept.sub_department !== d.data!.sub_department)
              ) {
                handleSetSelectedSubDept(d);
              } else {
                dispatch(setSelectedSubDept(null));
              }
            }}
            rowSelection="single"
            onGridReady={(event) => {
              event.api.forEachNode((node) => {
                if (node.data!.sub_department === topSubDept!.sub_department) {
                  const selected: TopSub = {
                    sub_department: node.data!.sub_department,
                    sub_department_description:
                      node.data!.sub_department_description,
                    total_sales: node.data!.total_sales,
                    net_sales: node.data!.net_sales,
                    qty: node.data!.qty,
                    digital_coupons: node.data!.digital_coupons,
                    elec_instore_coupons: node.data!.elec_instore_coupons,
                    elec_store_coupons: node.data!.elec_store_coupons,
                    store_coupon: node.data!.store_coupon,
                    total_tax: node.data!.total_tax,
                  };
                  dispatch(setSelectedSubDept(selected));
                  node.setSelected(true);
                }
              });
            }}
          />
        </div>
      )}
    </div>
  );
};

export default SubDeptGrid;
