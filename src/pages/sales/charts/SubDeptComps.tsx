import { useEffect } from "react";
import { getSubs } from "../../../api/sales";
// import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import { useAppSelector, useAppDispatch } from "../../../hooks";
// import SubCompCard from "./SubCompCard";
import { setPeriodSubSales } from "../../../features/salesSlice";
import { useToast } from "../../../components/toasts/hooks/useToast";

const SubDeptComps = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);
  const sales = useAppSelector((state) => state.sales);

  const setDates = (date: Date, days: number = 0) => {
    const d = new Date(date);
    d.setDate(d.getDate() - days);
    // returns yyyy-mm-dd so sub_sales endpoint can process the dates correctly
    return d.toISOString().split("T")[0];
  };

  useEffect(() => {
    getMonthlyTrend();
  }, [sales.selectedSalesPanel]);

  const getMonthlyTrend = () => {
    const date = new Date(sales.selectedSalesPanel.sale_date || search.endDate);
    
    // if the date is 1/27/2026 then the dates below are as follows
    // Week 2 => 1/20/2026 - 1/14/2026
    const wk2End = setDates(date, 7);
    const wk2Start = setDates(date, 13);
    getData(wk2Start, wk2End, 2);

    // Week 3 => 1/13/2026 - 1/7/2026
    const wk3End = setDates(date, 14);
    const wk3Start = setDates(date, 20);
    getData(wk3Start, wk3End, 3);

    // Week 4 => 1/6/2026 - 12/31/2025
    const wk4End = setDates(date, 21);
    const wk4Start = setDates(date, 27);
    getData(wk4Start, wk4End, 4);
  };

  const getData = (ws: string, we: string, period: number) => {
    const p = sales.selectedSalesPanel;
    const useGroups = search.type === "Group" ? 1 : 0;
    const singleStore = search.type === "Store" ? 1 : 0;
    const searchValue = useGroups === 1 ? search.lastGroup : search.lastStore;

    const groupParam = p.storeid > 0 ? 0 : useGroups;
    const singleStoreParam = p.storeid > 0 ? 1 : singleStore;
    const searchParam = p.storeid > 0 ? p.storeid : searchValue;
    getSubs(
      context.url,
      context.token,
      ws,
      we,
      groupParam,
      searchParam,
      singleStoreParam,
    ).then((resp) => {
      const j = resp.data;
      if (j.error === 0 && j.subs.length > 0) {
        dispatch(setPeriodSubSales({ subs: j.subs, period }));
      } else {
        toast.warn(`No Sub-Department data found for week ${period}.`);
      }
    });
  };

  // // Step One
  // if (sales.selectedSalesPanel.storeid === 0 && compareSubs.length === 0) {
  //   return (
  //     <div className="bg-custom-white rounded-lg shadow-lg flex justify-center items-center">
  //       Select a Sales Panel
  //     </div>
  //   );
  //   // Loading into Step 3
  // } else if (compareSubs.length === 0 && compareSalesPanel.storeid !== 0) {
  //   return (
  //     <div className="bg-custom-white rounded-lg shadow-lg relative">
  //       <LoadingIndicator message="Loading Sub-Department Comparisons..." />
  //     </div>
  //   );
  //   // Step Two
  // } else if (compareSubs.length === 0) {
  //   return (
  //     <div className="bg-custom-white rounded-lg shadow-lg flex justify-center items-center">
  //       Click "Compare Subs" on another sales panel to see comparisons
  //     </div>
  //   );
  // }

  // const formatDate = (dateStr: string) => {
  //   const dte = dateStr.split("T")[0].split("-");
  //   return `${parseInt(dte[1])}/${parseInt(dte[2])}/${parseInt(dte[0])}`;
  // };

  // const filteredSubs = subSales.filter((sub) =>
  //   compareSubs.some(
  //     (compSub) =>
  //       compSub.sub_department === sub.sub_department &&
  //       formatDate(sub.sale_date) ===
  //         formatDate(sales.selectedSalesPanel.sale_date) &&
  //       formatDate(sub.sale_date) === formatDate(compSub.sale_date),
  //   ),
  // );

  // const filteredComps = compareSubs.filter((compSub) =>
  //   subSales.some(
  //     (sub) =>
  //       sub.sub_department === compSub.sub_department &&
  //       formatDate(compSub.sale_date) ===
  //         formatDate(compareSalesPanel.sale_date) &&
  //       formatDate(compSub.sale_date) === formatDate(sub.sale_date),
  //   ),
  // );

  // Once we have both data sets, show the comparisons (final step)
  return (
    <div className="bg-custom-white rounded-lg shadow-lg p-2">

    </div>
    // <div className="bg-custom-white rounded-lg shadow-lg px-2 pt-1 pb-2">
    //   <div className="grid grid-cols-2">
    //     <div className="font-medium">
    //       Selected Panel: {sales.selectedSalesPanel.store_name}
    //     </div>
    //     <div className="font-medium">
    //       Compare Panel: {compareSalesPanel.store_name}
    //     </div>
    //   </div>
    //   <div className="grid grid-cols-2 gap-4 max-h-[275px] overflow-y-scroll no-scrollbar">
    //     <div className="space-y-3">
    //       {filteredSubs.map((sub) => (
    //         <SubCompCard key={Math.random()} sub={sub} type="selected" />
    //       ))}
    //     </div>

    //     <div className="space-y-3">
    //       {filteredComps.map((sub) => (
    //         <SubCompCard key={Math.random()} sub={sub} type="compare" />
    //       ))}
    //     </div>
    //   </div>
    // </div>
  );
};

export default SubDeptComps;
