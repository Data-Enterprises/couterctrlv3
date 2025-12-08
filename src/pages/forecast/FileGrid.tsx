import { useEffect, useState } from "react";
import { getBucketList } from "../../api/forecast";
import { useToast } from "../../components/toasts/hooks/useToast";
import { setFiles } from "../../features/forecastSlice";
import { useAppDispatch } from "../../hooks";
import { useForecastContext } from "./hooks";

import { AgGridReact } from "ag-grid-react";
import { theme } from ".";
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type ColGroupDef,
} from "ag-grid-community";
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

  return (
    <div className="bg-custom-white rounded-lg shadow-lg h-1/3">
      {/* <div className="h-full"> */}
        <AgGridReact
          rowData={tableData}
          columnDefs={colDefs}
          theme={theme}
          pagination={true}
          paginationAutoPageSize={true}
        />
      {/* </div> */}
    </div>
  );
};

export default FileGrid;
