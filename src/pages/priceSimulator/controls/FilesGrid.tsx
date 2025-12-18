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
} from "../../../features/priceSimSlice";
import { useAppDispatch } from "../../../hooks";
import { getFromExistingS3File } from "../../../api/forecast";

import { AgGridReact } from "ag-grid-react";
import { theme } from "../../forecast";
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type ColGroupDef,
  type RowClickedEvent,
} from "ag-grid-community";
import { formatQtyOutput, formatSalesOutput } from ".";
import { usePriceSimContext } from "../../priceSimulator/utils";
ModuleRegistry.registerModules([AllCommunityModule]);

type TableData = {
  date: string;
  name: string;
};

const FilesGrid = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = usePriceSimContext();
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
            const qtyOutput = formatQtyOutput(j);
            const salesOutput = formatSalesOutput(j);

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

export default FilesGrid;
