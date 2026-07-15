import { useEffect, useState } from "react";
import { getItemLookupSingleStore } from "../../../api/itemLookup";
import UpcScanner from "../../../components/scanner/UpcScanner";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useSubMarginActions } from "../hooks/useSubMarginActions";
import type { JsonError } from "../../../interfaces";
import { useSubMarginCtx } from "../hooks";
import ItemCardSingle from "./ItemCardSingle";
import ItemHistoryStatic from "./ItemHistoryStatic";
import { setUpcCode } from "../../../features/itemScanSlice";
import { WarningIcon } from "../../../components/toasts/Icons";
import type { ItemRowMobile } from "../display/widgets";
import { calculateCogs } from "..";

interface ScanViewProps {
  dates: string[];
}

const ScanView = ({ dates }: ScanViewProps) => {
  const ctx = useSubMarginCtx();
  const toast = useToast();
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();
  const scan = useAppSelector((state) => state.itemScan);
  const [msg, setMsg] = useState<string>("");
  const [activeDates, setActiveDates] = useState<string[]>([]);

  useEffect(() => {
    // This is setting the active dates for the scanned item
    if (ctx.scannedItemMobile !== null) {
      console.log(
        ctx.margins.filter(
          (margin) =>
            margin.product_code.includes("1200000017")
            // margin.sale_date.split("T")[0] === "2026-04-05",
        ),
      );
      const viewDates = ctx.margins
        .filter((margin) => {
          const matchesUpc = margin.product_code.includes(scan.upcCode);
          const matchesDate =
            dates.indexOf(margin.sale_date.split("T")[0]) > -1;
          return matchesUpc && matchesDate;
        })
        .map((margin) => margin.sale_date.split("T")[0]);

      // console.log("view dates", viewDates);
      // console.log(dates, viewDates);
      setActiveDates(viewDates);
    }
  }, [dates, ctx.scannedItemMobile]);

  useEffect(() => {
    if (!ctx.viewDaily && ctx.scannedItemMobile && !scan.upcCode.length) {
      dispatch(setUpcCode(ctx.scannedItemMobile.product_code));
    }
  }, [ctx.viewDaily]);

  const subDept = ctx.subDepts.find((s) => s.id === ctx.selectedSubDeptId);

  const handleScan = (upc: string) => {
    setMsg("");
    const item = ctx.itemDataMobile.find((item) => item.product_code === upc);
    if (!item) {
      setMsg(`No items found with UPC containing`);
      return;
    }

    dispatch(actions.setScannedItemMobile(item));
    dispatch(actions.setScannedItemHistory([]));
    dispatch(actions.setFetchingItemHistory(true));
    
    // 7 be default since this whole module is going one week back
    getItemLookupSingleStore(ctx.url, ctx.token, upc, ctx.searchValue, 7)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(actions.setScannedItemHistory(j.history));
        } else {
          const warningMsg = j.msg
            .toString()
            .replace(/'/g, "")
            .replace("_", " ");
          setMsg("Error processing " + warningMsg);
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(actions.setFetchingItemHistory(false)));
  };

  const clear = () => {
    dispatch(actions.setScannedItemMobile(null));
    dispatch(actions.setScannedItemHistory([]));
    dispatch(setUpcCode(""));
    dispatch(actions.setSelectedWeekDay(""));
    setMsg("");
  };

  const formatDteStr = (dteStr: string) => {
    const split = dteStr.split("-");
    return `${split[1]}/${split[2]}`;
  };

  const fullDate = (dte: string) => {
    const split = dte.split("T")[0].split("-");
    return `${split[1]}/${split[2]}/${split[0]}`;
  };

  const setWeekDay = (dteStr: string) => {
    const weekDay = dteStr === "" ? "" : fullDate(dteStr);
    if (dteStr === "") {
      dispatch(actions.setSelectedWeekDay(""));
    } else {
      dispatch(actions.setSelectedWeekDay(weekDay));
    }

    // Otherwise, we are clicking on an actual date
    dispatch(actions.setSelectedWeekDay(weekDay));

    const upc = scan.upcCode;
    const filtered = ctx.margins.filter((margin) => {
      const matchesDate = fullDate(margin.sale_date).includes(weekDay);
      const matchesUpc = margin.product_code.includes(upc);
      return matchesUpc && matchesDate;
    });

    const reduced = filtered.reduce((acc: ItemRowMobile, margin) => {
      if (!acc.product_code) {
        acc = {
          sub_department_description: margin.sub_department_description,
          product_code: margin.product_code,
          product_description: margin.product_description,
          cogs: calculateCogs(
            margin.net_cost,
            margin.cost,
            margin.case_size,
            margin.qty,
            margin.weight,
          ),
          cost_fees: margin.cost_fees,
          total_sales: margin.total_sales,
          net_sales: margin.net_sales,
          total_tax: margin.total_tax,
          qty: margin.qty,
          margin: 0,
          calculated_cost: margin.calculated_cost,
          cost: margin.cost,
        };
      } else {
        acc.cogs += calculateCogs(
          margin.net_cost,
          margin.cost,
          margin.case_size,
          margin.qty,
          margin.weight,
        );
        acc.total_sales += margin.total_sales;
        acc.net_sales += margin.net_sales;
        acc.total_tax += margin.total_tax;
        acc.qty += margin.qty;
      }
      return acc;
    }, {} as ItemRowMobile);

    reduced.margin =
      ((reduced.total_sales - reduced.cogs) / reduced.total_sales) * 100 || 0;

    // console.log("filtered", filtered);
    // console.log("reduced", reduced);
    dispatch(actions.setScannedItemMobile(reduced));
  };

  const activeDateStyle = (d: string) => {
    const clickedDate = fullDate(d);
    return clickedDate === ctx.selectedWeekDay;
  };

  return (
    <div className="space-y-2">
      {!ctx.scannedItemMobile && (
        <UpcScanner handleScan={handleScan} onClear={clear} />
      )}
      {/* <UpcScanner handleScan={handleScan} onClear={clear} /> */}
      {msg.length ? (
        <div className="w-full mt-4 flex flex-col items-center justify-center text-content/85 font-medium">
          <div className="text-center p-2 rounded-lg shadow-lg bg-custom-white flex flex-col items-center gap-1 w-full">
            <WarningIcon height={60} width={60} fill="rgb(249 115 22)" />
            <div className="text-orange-500">{msg}</div>
            <div>"{scan.upcCode}"</div>
            <div>Sub Dept: {subDept!.desc}</div>
          </div>
        </div>
      ) : null}
      {ctx.scannedItemMobile ? (
        <div className="text-[13px] rounded-lg">
          <div className="grid grid-cols-4 text-center gap-2 mb-2">
            <div
              className={`${ctx.selectedWeekDay === "" ? "bg-orange-200 font-medium" : ""} rounded-full bg-custom-white px-0 py-0.5`}
              onClick={() => setWeekDay("")}
            >
              All Dates
            </div>
            {activeDates.map((d, i) => (
              <div
                key={i}
                className={`${activeDateStyle(d) ? "bg-orange-200 font-medium" : ""} rounded-full bg-custom-white px-0 py-0.5`}
                onClick={() => setWeekDay(d)}
              >
                {formatDteStr(d)}
              </div>
            ))}
            <div
              className="rounded-full bg-orange-500 text-custom-white font-medium px-0 py-0.5"
              // className="rounded-full bg-custom-white px-0 py-0.5"
              onClick={clear}
            >
              Clear
            </div>
          </div>
          <ItemCardSingle item={ctx.scannedItemMobile} />
          <div className="grid grid-cols-2 h-0.5">
            <div className="bg-gradient-to-r from-blue-200 to-custom-white"></div>
            <div className="bg-gradient-to-l from-blue-200 to-custom-white"></div>
          </div>
          <ItemHistoryStatic showClose={false} />
        </div>
      ) : null}
    </div>
  );
};

export default ScanView;
