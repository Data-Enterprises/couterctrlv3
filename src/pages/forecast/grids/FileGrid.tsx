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

import { AgGridReact } from "ag-grid-react";
import { formatRowData, theme } from "..";
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type ColGroupDef,
  type RowClickedEvent,
} from "ag-grid-community";
import { useForecastContext } from "../hooks";
import type { JsonError, PriceHistoryFromListResp } from "../../../interfaces";
import { getHistoryFromList } from "../../../api/priceSim";
ModuleRegistry.registerModules([AllCommunityModule]);

type TableData = {
  date: string;
  name: string;
};

const FileGrid = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useForecastContext();
  const [tableData, setTableData] = useState<TableData[]>([]);

  const colDefs: (ColDef<TableData> | ColGroupDef<TableData>)[] = [
    {
      headerName: "Date",
      field: "date",
      flex: 0.7,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    { headerName: "Select UPC List", field: "name", flex: 1.3 },
  ];

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

              return {
                date: date,
                name: display,
              };
            })
            .sort((a, b) => {
              const dateA = new Date(a.date);
              const dateB = new Date(b.date);
              return dateB.getTime() - dateA.getTime();
            });
            
          setTableData(data);
        }
      })
      .catch((err) => {
        toast.error(err.message);
      });
  };

  useEffect(() => {
    getFileNames();
  }, [context.forecastResults]);

  const onRowClicked = (event: RowClickedEvent<TableData>) => {
    if (event.data) {
      dispatch(setIsLoading(true));
      dispatch(reQuery());

      const fileDate = event.data.date.replace(/\//g, "_");
      const fileName = `${context.userid}_${fileDate}_${event.data.name}`;

      // Insert the fixed price_history_from_list call here => after it can take in a file name
      getHistoryFromList(
        context.url,
        context.token,
        context.storeids,
        context.endDate,
        "",
        fileName
      )
        .then((resp) => {
          const j: PriceHistoryFromListResp = resp.data;
          if (j.error === 0 && j.results.length > 0) {
            // Set the upc items for the controls
            const upcItems = j.results.map((item) => ({
              upc: item.upc,
              description: item.description,
            }));
            dispatch(setItems(upcItems));

            // set the raw data => needed to grab the prices and figure out the forecast values
            dispatch(setForecastResults(j.results));

            const singlePrices = j.results.filter(
              (item) => item.price_history.length === 1
            );
            const multiPrices = j.results.filter(
              (item) => item.price_history.length > 1
            );

            // set the row data
            const rowData = formatRowData(multiPrices);
            dispatch(setInitialRowData(rowData));
            dispatch(setSingleForecastResults(singlePrices));
          } else {
            dispatch(setNoResults(true));
          }
        })
        .catch((err: JsonError) => toast.error(err.message))
        .finally(() => dispatch(setIsLoading(false)));
    }
  };

  return (
    <div className="bg-custom-white rounded-lg shadow-lg z-0">
      <AgGridReact
        rowData={tableData}
        columnDefs={colDefs}
        theme={theme}
        pagination={true}
        paginationAutoPageSize={true}
        onRowClicked={onRowClicked}
      />
    </div>
  );
};

export default FileGrid;
