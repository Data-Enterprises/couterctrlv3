import type { ColDef } from "ag-grid-community";

const save = (uri: string, filename: string) => {
  const link = document.createElement("a");
  document.body.appendChild(link);
  link.download = filename;
  link.href = uri;
  link.click();
};

export const csv = (headers: string, data: string, filename: string) => {
  const output = headers + "\r\n" + data;
  const uriContent =
    "data:application/octec-stream," + encodeURIComponent(output);
  save(uriContent, filename);
};

export const handleCsv = <T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers: ColDef<T>[]
) => {
  let body = "";
  const headersString = headers
    .filter((h) => h.hide !== true)
    .map((h) => h.headerName)
    .join(",");

  data.forEach((record) => {
    let line = "";
    headers.forEach((header) => {
      const val = record[header.field as keyof T];
      const strVal = val !== null && val !== undefined ? String(val) : "";
      line += `"${strVal.replace(/"/g, '""')}",`;
    });
    body += line.substring(0, line.length - 1) + "\r\n";
  });

  csv(headersString, body, filename);
};

export const exportData = <T extends Record<string, any>>(
  data: T[],
  headers: ColDef<T>[],
  fileName: string
) => {
  const regex = new RegExp("\\.csv", "gi"); // 'gi' for global and case-insensitive
  handleCsv(
    data,
    `${fileName
      .replace(regex, "")
      .split(" ")
      .join("_")}_${filename_date()}.csv`,
    headers
  );
};

export const filename_date = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${month}_${day}_${year}`;
};
