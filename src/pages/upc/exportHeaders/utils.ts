import type { ITableHeader } from ".";

export const filename_date = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${month}_${day}_${year}`;
};

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
  } catch (e: unknown) {
    return e instanceof Error ? e.message : String(e);
  }
};

export const handleUpcCsv = <T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers: ITableHeader[]
) => {
  let body = "";
  const headersString = headers
    .filter((h) => h.visible)
    .map((h) => h.alias)
    .join(",");

  data.map((record) => {
    let line = "";
    headers.map((header) => {
      if (header.visible) {
        line += `"${record[header.column]}",`;
      }
    });
    body += line.substring(0, line.length - 1) + "\r\n";
  });

  csv(headersString, body, filename);
};

export const exportData = <T extends Record<string, any>>(
  data: T[],
  headers: ITableHeader[],
  fileName: string
) => {
  const regex = new RegExp("\\.csv", "gi");
  handleUpcCsv(
    data,
    `${fileName
      .replace(regex, "")
      .split(" ")
      .join("_")}_${filename_date()}.csv`,
    headers
  );
};
