import { useEffect, useState } from "react";
import { getBucketList } from "../../../api/forecast";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  reQuery,
  setFiles,
  setForecastResults,
  setInitialRowData,
  setIsLoading,
  setItems,
  setNoResults,
  setSingleForecastResults,
} from "../../../features/forecastSlice";
import { useAppDispatch } from "../../../hooks";
import { clearAdListData } from "../../../features/adListSlice";
import { formatRowData, formatSinglePriceRowData, useScrollHeight } from "..";
import { useForecastContext } from "../hooks";
import type { JsonError, PriceHistoryFromListResp } from "../../../interfaces";
import { getHistoryFromList } from "../../../api/priceSim";

type TableData = {
  date: string;
  name: string;
};

const FileGrid = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useForecastContext();
  const [tableData, setTableData] = useState<TableData[]>([]);
  const { topRef } = useScrollHeight();

  const getFileNames = () => {
    getBucketList(context.url, context.token)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setFiles(j.files));
          const data = [...j.files]
            .map((file) => {
              const split = file.split("_");
              const date = `${split[1]}/${split[2]}/${split[3]}`;
              const display = file.split("_").slice(4).join("_");
              return { date, name: display };
            })
            .sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            );
          setTableData(data);
        }
      })
      .catch((err) => toast.error(err.message));
  };

  useEffect(() => {
    getFileNames();
  }, [context.forecastResults]);

  const handleRowClick = (item: TableData) => {
    dispatch(setIsLoading(true));
    dispatch(reQuery());
    dispatch(clearAdListData());

    const fileDate = item.date.replace(/\//g, "_");
    const fileName = `${context.userid}_${fileDate}_${item.name}`;

    getHistoryFromList(
      context.url,
      context.token,
      context.storeids,
      context.endDate,
      "",
      fileName,
    )
      .then((resp) => {
        const j: PriceHistoryFromListResp = resp.data;
        if (j.error === 0 && j.results.length > 0) {
          const upcItems = j.results.map((item) => ({
            upc: item.upc,
            description: item.description,
          }));
          dispatch(setItems(upcItems));
          dispatch(setForecastResults(j.results));

          const singlePrices = j.results.filter(
            (item) => item.price_history.length === 1,
          );
          const multiPrices = j.results.filter(
            (item) => item.price_history.length > 1,
          );

          const rowData = [
            ...formatRowData(multiPrices),
            ...formatSinglePriceRowData(singlePrices),
          ];
          dispatch(setInitialRowData(rowData));
          dispatch(setSingleForecastResults(singlePrices));
        } else {
          dispatch(setNoResults(true));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(setIsLoading(false)));
  };

  return (
    <div className="bg-custom-white rounded-lg shadow-lg overflow-hidden">
      <div
        ref={topRef}
        className="bg-blue-500 text-custom-white text-xs font-medium px-3 py-1 rounded-t-lg"
      >
        Select UPC List
      </div>
      <div
        className="overflow-y-auto thin-scrollbar"
        style={{ maxHeight: 250 }}
      >
        {tableData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-gray-400">
            No saved lists
          </div>
        ) : (
          tableData.map((item, i) => (
            <div
              key={i}
              className="px-3 py-1.5 text-xs cursor-pointer hover:bg-blue-50 border-b border-gray-100 even:bg-blue-50/40 truncate"
              onClick={() => handleRowClick(item)}
            >
              {item.date.split("/").join("_")}_{item.name}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FileGrid;
