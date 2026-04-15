import { useEffect, useState } from "react";
import { getSubs } from "../../../api/sales";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { setPeriodSubSales } from "../../../features/salesSlice";
import { useToast } from "../../../components/toasts/hooks/useToast";
import SubDeptPeriodCard from "./SubDeptPeriodCard";
import { sameWeekDayLastYear } from "../../../utils";

interface Props {
  inReport?: boolean;
}

const SubDeptComps = ({ inReport = false }: Props) => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);
  const sales = useAppSelector((state) => state.sales);
  const [lyDateRange, setLyDateRange] = useState<string>("");

  const setDates = (date: Date, days: number = 0) => {
    const d = new Date(date);
    d.setDate(d.getDate() - days);
    // returns yyyy-mm-dd so sub_sales endpoint can process the dates correctly
    return d.toISOString().split("T")[0];
  };

  useEffect(() => {
    // if (sales.selectedSalesPanel.storeid > 0) {
    // }
    getMonthlyTrend();
  }, [sales.selectedSalesPanel]);

  const formatDate = (dateStr: string) => {
    const dte = dateStr.split("-");
    return `${parseInt(dte[1])}/${parseInt(dte[2])}/${parseInt(dte[0])}`;
  };

  const getMonthlyTrend = () => {
    const date = new Date(
      sales.selectedSalesPanel.sale_date || search.singleDate,
    );

    const wkEnd = setDates(date);
    const wk1Start = setDates(date, 6);
    getData(wk1Start, wkEnd, 1);

    const endDateLY = sameWeekDayLastYear(wkEnd);
    const lyDate = new Date(endDateLY.date);
    const lyWkEnd = setDates(lyDate);
    const lyWkStart = setDates(lyDate, 6);
    getData(lyWkStart, lyWkEnd, 2);
    setLyDateRange(`${formatDate(lyWkStart)} - ${formatDate(lyWkEnd)}`);
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
    const date = new Date(
      sales.selectedSalesPanel.sale_date || search.singleDate,
    );
    const we = setDates(date);
    const ws = setDates(date, 6);
    return `${formatDate(ws)} - ${formatDate(we)}`;
  };

  // Once we have both data sets, show the comparisons (final step)
  return (
    <div className="">
      {!inReport ? (
        <div className="grid md:grid-cols-2 h-full gap-2">
          <SubDeptPeriodCard
            inReport={inReport}
            data={sales.subSalesWk1}
            dateRange={formateFirstWk()}
            period={1}
          />
          <SubDeptPeriodCard
            inReport={inReport}
            data={sales.subSalesWk2}
            dateRange={lyDateRange}
            period={2}
          />
          {/* <SubDeptPeriodCard
            inReport={inReport}
            data={sales.subSalesWk3}
            dateRange={dateRange.wk3}
            period={3}
          />
          <SubDeptPeriodCard
            inReport={inReport}
            data={sales.subSalesWk4}
            dateRange={dateRange.wk4}
            period={4}
          /> */}
        </div>
      ) : null}
    </div>
  );
};

export default SubDeptComps;
