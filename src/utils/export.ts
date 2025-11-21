import type { ColDef } from "ag-grid-community";

const save = (uri: string, filename: string) => {
  const link = document.createElement("a");
  if (typeof link.download == "string") {
    document.body.appendChild(link);
    link.download = filename;
    link.href = uri;
    link.click();
  }
};

export const csv = (headers: string, data: string, filename: string) => {
  try {
    const output = headers + "\r\n" + data;

    const uriContent =
      "data:application/octec-stream," + encodeURIComponent(output);
    save(uriContent, filename);
  } catch (e) {
    if (e instanceof Error) {
      return e.message;
    }
    return String(e);
  }
};

export const handleUpcCsv = <T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers: ColDef<T>[]
) => {
  let body = "";
  const headersString = headers
    .filter((h) => h.hide !== true)
    .map((h) => h.headerName)
    .join(",");

  data.map((record) => {
    let line = "";
    headers.forEach((header) => {
      if (header.field) {
        const val = record[header.field as keyof T];
        line += `"${val.replace(/"/g, '""')}",`;
      }
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
  handleUpcCsv(
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
