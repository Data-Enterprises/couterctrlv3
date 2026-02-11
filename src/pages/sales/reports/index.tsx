import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

import type { ColDef, ColGroupDef } from "ag-grid-community";
import type { WeeklySale } from "../../../interfaces";
import {
  formatBigNumber,
  formatCurrency2,
  formatDateSimple,
} from "../../../utils";

export const salesPanelCols: (ColDef<WeeklySale> | ColGroupDef<WeeklySale>)[] =
  [
    {
      headerName: "Store",
      field: "store_name",
      headerStyle: { borderRight: "1px solid white" },
      resizable: false,
      flex: 1,
    },
    {
      headerName: "Sale Date",
      field: "sale_date",
      valueFormatter: (params) => formatDateSimple(params.value),
      headerStyle: { borderRight: "1px solid white" },
      resizable: false,
      flex: 1,
    },
    {
      headerName: "Sales",
      field: "total_sales",
      valueFormatter: (params) =>
        formatCurrency2(params.value - params.data!.total_tax),
      headerStyle: { borderRight: "1px solid white" },
      resizable: false,
      flex: 1,
    },
    {
      headerName: "Qty",
      field: "qty",
      valueFormatter: (params) => formatBigNumber(params.value, 0),
      headerStyle: { borderRight: "1px solid white" },
      resizable: false,
      flex: 1,
    },
    {
      headerName: "Weight",
      field: "weight",
      valueFormatter: (params) => formatBigNumber(params.value, 2),
      resizable: false,
      flex: 1,
    },
  ];

export const exportPdf = async (ref: HTMLDivElement, fileName: string) => {
  const canvas = await html2canvas(ref, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
  });
  const data = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: "a4",
  });

  const properties = pdf.getImageProperties(data);
  const width = pdf.internal.pageSize.getWidth();
  const height = (properties.height * width) / properties.width;

  pdf.addImage(data, "PNG", 0, 0, width, height);
  pdf.save(`${fileName.replaceAll(" ", "_")}.pdf`);
};

export const getPdfBlob = async (ref: React.RefObject<HTMLDivElement>) => {
  const canvas = await html2canvas(ref.current, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
  });
  const data = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "px",
    format: "a4",
  });

  const properties = pdf.getImageProperties(data);
  const width = pdf.internal.pageSize.getWidth();
  const height = (properties.height * width) / properties.width;

  pdf.addImage(data, "PNG", 0, 0, width, height);
  return pdf.output("blob");
};
