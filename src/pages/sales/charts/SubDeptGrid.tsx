import { useSalesState } from "../hooks/useSalesState";
import { useState, useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useSubCols } from "../components";
import { AgGridReact } from "ag-grid-react";
import { theme, type TopSub } from "../components";
ModuleRegistry.registerModules([AllCommunityModule]);
import {
  AllCommunityModule,
  ModuleRegistry,
  type RowClickedEvent,
} from "ag-grid-community";
import type { SubGridRow } from "../../../interfaces";
import { subDeptKeyMode, subDeptKeyOf } from "../../../utils/subDeptIdentity";

/** SubGridRow plus the bucket key it was grouped under — the id, or the
 *  description at companies that don't number their departments. */
type SubGridRowKeyed = SubGridRow & { subDeptKey: string };
import { useSalesActions } from "../hooks/useSalesActions";
import SingleSelect from "../../../components/SingleSelect";

const SubDeptGrid = () => {
  const gridRef = useRef<AgGridReact<SubGridRow>>(null);
  const dispatch = useAppDispatch();
  const actions = useSalesActions();
  const {
    subSales,
    selectedSubDept,
    selectedSalesPanel,
    subSalesWk3,
    topSubDept,
  } = useSalesState();
  const { isMobile, isTablet } = useAppSelector((state) => state.app);
  const [groupSubs, setGroupSubs] = useState<SubGridRowKeyed[]>([]);
  // Needed in render too, to compare the stored selection against a row's key.
  const mode = subDeptKeyMode(subSales);
  const { subCols } = useSubCols();

  // This useEffect does the same as above, but when the groupSubs changes
  // This triggers the change in the grid, so this reflects in the salesSlice.ts file
  useEffect(() => {
    if (groupSubs.length) {
      const topSub = groupSubs[0];
      const selected: TopSub = {
        sub_department: topSub.sub_department,
        sub_department_description: topSub.sub_department_description,
        total_sales: topSub.total_sales - topSub.total_tax,
        net_sales: topSub.net_sales,
        qty: topSub.qty,
        digital_coupons: topSub.digital_coupons,
        elec_instore_coupons: topSub.elec_instore_coupons,
        elec_store_coupons: topSub.elec_store_coupons,
        store_coupon: topSub.store_coupon,
        total_tax: topSub.total_tax,
      };
      dispatch(actions.setSelectedSubDept(selected));
    }
  }, [groupSubs]);

  useEffect(() => {
    // Identity comes from the period on screen; last year is bucketed the same
    // way so its totals land on the matching row. See utils/subDeptIdentity.
    const getLastYrSales = (key: string) => {
      return subSalesWk3
        .filter((s) => subDeptKeyOf(s, mode) === key)
        .reduce(
          (acc: number, curr) => (acc += curr.total_sales - curr.total_tax),
          0,
        );
    };

    const grouped = () => {
      return [...subSales].reduce((acc: SubGridRowKeyed[], curr) => {
        const key = subDeptKeyOf(curr, mode);
        const exists = acc.find((d) => d.subDeptKey === key);
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
          const lastYrSales = getLastYrSales(key);
          acc.push({ ...curr, subDeptKey: key, lastYrSales });
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
    dispatch(actions.setSelectedSubDept(selected));
  };

  const handleSelect = (subDept: string | number) => {
    const d = groupSubs.find((s) => s.subDeptKey === String(subDept));
    if (!d) return;
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
    dispatch(actions.setSelectedSubDept(selected));
  };

  if (isMobile)
    return (
      <div className="mb-2 flex justify-between items-center">
        <SingleSelect
          data={groupSubs}
          displayKey="sub_department_description"
          valueKey="subDeptKey"
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
    );

  return (
    <div className={`bg-custom-white rounded-lg shadow-lg pb-2 pt-1 ${isTablet ? "h-[300px]" : "h-full"}`}>
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
              subDeptKeyOf(selectedSubDept, mode) !== subDeptKeyOf(d.data!, mode)
            ) {
              handleSetSelectedSubDept(d);
            }
          }}
          rowSelection="single"
        />
      </div>
    </div>
  );
};

export default SubDeptGrid;
