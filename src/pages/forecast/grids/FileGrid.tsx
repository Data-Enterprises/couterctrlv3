import { useEffect, useState } from "react";
import { getBucketList } from "../../../api/forecast";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  reQuery,
  setFiles,
  setIsLoading,
  // setItems,
  // setQty,
  // setSales,
} from "../../../features/forecastSlice";
import { useAppDispatch } from "../../../hooks";
// import { getFromExistingS3File } from "../../../api/forecast";

import { AgGridReact } from "ag-grid-react";
import { theme } from "..";
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type ColGroupDef,
  type RowClickedEvent,
} from "ag-grid-community";
// import type { ForecastQtyData, ForecastSalesData } from "../../../interfaces";
import { useForecastContext } from "../hooks";
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

      // Insert the fixed price_history_from_list call here => after it can take in a file name
    }
  };

  return (
    <div className="bg-custom-white rounded-lg shadow-lg">
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
