import { useEffect, useState } from "react";
import { getBucketList } from "../../../api/forecast";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  reQuery,
  setFiles,
  setIsLoading,
  setItems,
  setQty,
  setSales,
} from "../../../features/forecastSlice";
import { useAppDispatch } from "../../../hooks";
import { useForecastContext } from "../hooks";
import { getFromExistingS3File } from "../../../api/forecast";

import { AgGridReact } from "ag-grid-react";
import { theme } from "..";
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type ColGroupDef,
  type RowClickedEvent,
} from "ag-grid-community";
import type { ForecastQtyData, ForecastSalesData } from "../../../interfaces";
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
    { headerName: "Name", field: "name", flex: 1.3 },
  ];

  useEffect(() => {
    getBucketList(context.url, context.token)
      .then((resp) => {
        // Handle the response here
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setFiles(j.files));
          const data = [...j.files].map((file) => {
            const split = file.split("_");
            const date = `${split[1]}/${split[2]}/${split[3]}`;

            return {
              date: date,
              name: file,
            };
          });
          setTableData(data);
        }
      })
      .catch((err) => {
        toast.error(err.message);
      });
  }, []);

  const onRowClicked = (event: RowClickedEvent<TableData>) => {
    if (event.data) {
      dispatch(setIsLoading(true));
      dispatch(reQuery());
      const fileName = event.data.name;
      getFromExistingS3File(
        context.url,
        context.token,
        context.storeids,
        context.startDate,
        context.endDate,
        fileName
      )
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            const qtyOutput: ForecastQtyData<any>[] = Object.entries(
              j.qty_output
            ).map(([k, v]) => {
              const upc = k as string;
              const data = v as any;
              return {
                upc,
                history: data.history,
                history_dimension: data.history_dimension,
                forecast: data.forecast,
                forecast_dimension: data.forecast_dimension,
                forecast_method: data.forecast_method,
                metrics: data.metrics,
              };
            });

            const salesOutput: ForecastSalesData<any>[] = Object.entries(
              j.sales_output
            ).map(([k, v]) => {
              const upc = k as string;
              const data = v as any;
              return {
                upc,
                history: data.history,
                history_dimension: data.history_dimension,
                forecast: data.forecast,
                forecast_dimension: data.forecast_dimension,
                forecast_method: data.forecast_method,
                metrics: data.metrics,
              };
            });

            const upcItems = qtyOutput.map((item) => ({
              upc: item.upc,
              description: item.metrics.description,
            }));

            dispatch(setQty(qtyOutput));
            dispatch(setSales(salesOutput));
            dispatch(setItems(upcItems));
          }
        })
        .catch((err) => {
          toast.error(err.message);
        })
        .finally(() => dispatch(setIsLoading(false)));
    }
  };

  return (
    <div className="bg-custom-white rounded-lg shadow-lg h-1/3">
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
