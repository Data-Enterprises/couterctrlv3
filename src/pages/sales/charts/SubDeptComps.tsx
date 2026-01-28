import { useEffect, useState } from "react";
import { getSubs } from "../../../api/sales";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { setPeriodSubSales } from "../../../features/salesSlice";
import { useToast } from "../../../components/toasts/hooks/useToast";
import SubDeptPeriodCard from "./SubDeptPeriodCard";

const SubDeptComps = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);
  const sales = useAppSelector((state) => state.sales);

  const [dateRange, setDateRange] = useState<{
    wk2: string;
    wk3: string;
    wk4: string;
  }>({ wk2: "", wk3: "", wk4: "" });

  const setDates = (date: Date, days: number = 0) => {
    const d = new Date(date);
    d.setDate(d.getDate() - days);
    // returns yyyy-mm-dd so sub_sales endpoint can process the dates correctly
    return d.toISOString().split("T")[0];
  };

  useEffect(() => {
    getMonthlyTrend();
  }, [sales.selectedSalesPanel]);

  const formatDate = (dateStr: string) => {
    const dte = dateStr.split("-");
    return `${parseInt(dte[1])}/${parseInt(dte[2])}/${parseInt(dte[0])}`;
  };

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

    setDateRange({
      wk2: `${formatDate(wk2Start)} - ${formatDate(wk2End)}`,
      wk3: `${formatDate(wk3Start)} - ${formatDate(wk3End)}`,
      wk4: `${formatDate(wk4Start)} - ${formatDate(wk4End)}`,
    });
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

  const formateFirstWk = () => {
    const date = new Date(sales.selectedSalesPanel.sale_date || search.endDate);
    const we = setDates(date);
    const ws = setDates(date, 6);
    return `${formatDate(ws)} - ${formatDate(we)}`;
  };

  // Once we have both data sets, show the comparisons (final step)
  return (
    <div className="">
      <div className="grid grid-cols-2 h-full gap-2">
        <SubDeptPeriodCard
          data={sales.subSales}
          dateRange={formateFirstWk()}
          period={1}
        />
        <SubDeptPeriodCard
          data={sales.subSalesWk2}
          dateRange={dateRange.wk2}
          period={2}
        />
        <SubDeptPeriodCard
          data={sales.subSalesWk3}
          dateRange={dateRange.wk3}
          period={3}
        />
        <SubDeptPeriodCard
          data={sales.subSalesWk4}
          dateRange={dateRange.wk4}
          period={4}
        />
      </div>
    </div>
  );
};

export default SubDeptComps;
