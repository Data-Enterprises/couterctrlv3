import { useAppSelector, useAppDispatch } from "../../../hooks";
import { AgGridReact } from "ag-grid-react";
import { theme, subCols, type TopSub } from "../components";
ModuleRegistry.registerModules([AllCommunityModule]);
import {
  AllCommunityModule,
  ModuleRegistry,
  type RowClickedEvent,
} from "ag-grid-community";
import type { SubGridRow } from "../../../interfaces";
import { setSelectedSubDept } from "../../../features/salesSlice";
import { useState, useEffect, useRef } from "react";

const SubDeptGrid = () => {
  const gridRef = useRef<AgGridReact<SubGridRow>>(null);
  const dispatch = useAppDispatch();
  const { subSales, selectedSubDept, selectedSalesPanel, subSalesWk3 } =
    useAppSelector((state) => state.sales);
  const [groupSubs, setGroupSubs] = useState<SubGridRow[]>([]);

  const setSelected = () => {
    if (gridRef.current && gridRef.current.api) {
      // find the first node)
      const firstNode = gridRef.current.api.getDisplayedRowAtIndex(0);
      if (!firstNode) return;

      const selected: TopSub = {
        sub_department: firstNode.data!.sub_department,
        sub_department_description: firstNode.data!.sub_department_description,
        total_sales: firstNode.data!.total_sales,
        net_sales: firstNode.data!.net_sales,
        qty: firstNode.data!.qty,
        digital_coupons: firstNode.data!.digital_coupons,
        elec_instore_coupons: firstNode.data!.elec_instore_coupons,
        elec_store_coupons: firstNode.data!.elec_store_coupons,
        store_coupon: firstNode.data!.store_coupon,
        total_tax: firstNode.data!.total_tax,
      };
      dispatch(setSelectedSubDept(selected));
      firstNode.setSelected(true);
    }
  };

  useEffect(() => {
    if (subSales.length && subSalesWk3.length) {
      console.log("testing");
      setSelected();
    }
  }, [subSalesWk3, gridRef.current, subSales]);

  // This useEffect does the same as above, but when the groupSubs changes
  // This triggers the change in the grid, so this reflects in the salesSlice.ts file
  useEffect(() => {
    if (groupSubs.length) {
      const topSub = groupSubs[0];
      const selected: TopSub = {
        sub_department: topSub.sub_department,
        sub_department_description: topSub.sub_department_description,
        total_sales: topSub.total_sales,
        net_sales: topSub.net_sales,
        qty: topSub.qty,
        digital_coupons: topSub.digital_coupons,
        elec_instore_coupons: topSub.elec_instore_coupons,
        elec_store_coupons: topSub.elec_store_coupons,
        store_coupon: topSub.store_coupon,
        total_tax: topSub.total_tax,
      };
      dispatch(setSelectedSubDept(selected));
    }
  }, [groupSubs]);

  useEffect(() => {
    const getLastYrSales = (subDeptId: number) => {
      return subSalesWk3
        .filter((s) => s.sub_department === subDeptId)
        .reduce(
          (acc: number, curr) => (acc += curr.total_sales - curr.total_tax),
          0,
        );
    };

    const grouped = () => {
      return [...subSales].reduce((acc: SubGridRow[], curr) => {
        const exists = acc.find(
          (d) => d.sub_department === curr.sub_department,
        );
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
          const lastYrSales = getLastYrSales(curr.sub_department);
          acc.push({ ...curr, lastYrSales: lastYrSales });
        }
        return acc;
      }, []);
    };

    const result = grouped();

    setGroupSubs(result);
  }, [subSales, subSalesWk3]);

  const handleSetSelectedSubDept = (d: RowClickedEvent<SubGridRow>) => {
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

  return (
    <div className="bg-custom-white rounded-lg shadow-lg pb-2 pt-1 h-full">
      <div className="px-2 flex justify-between items-center text-sm">
        <span className="font-medium">
          {selectedSalesPanel.sale_date ? "Daily" : "Weekly"} Sub Department
          Sales
        </span>
      </div>

      <div className="px-2 h-[92%]">
        <AgGridReact<SubGridRow>
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
            }
          }}
          rowSelection="single"
          onGridReady={(event) => {
            event.api.forEachNode((node, i) => {
              // No checking against the selectedSubDept here
              // because this runs only when the grid is ready,
              // so the first sub dept in the grid is always the top sub dept
              if (i === 0) {
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
              return;
            });
          }}
        />
      </div>
    </div>
  );
};

export default SubDeptGrid;
