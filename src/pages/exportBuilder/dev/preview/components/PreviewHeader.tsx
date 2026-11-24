// Components
import { DocumentTextIcon, TableCellsIcon } from "@heroicons/react/24/outline";

interface PreviewHeaderProps {
  /** The lines file or the summary; it picks the icon. */
  kind: "lines" | "summary";
  fileName: string;
  /** The file's columns or keys and measures, in a line. */
  counts: string;
  /** The right-hand note. */
  status: string;
}

/** The preview's title row: the file's name, what it holds, and a note. */
const PreviewHeader = ({
  kind,
  fileName,
  counts,
  status,
}: PreviewHeaderProps) => (
  <div className="flex items-center gap-3 px-4 py-2.5 bg-custom-white border-b border-brand_line flex-shrink-0">
    {kind === "lines" ? (
      <DocumentTextIcon className="w-4 h-4 text-content/95 flex-shrink-0" />
    ) : (
      <TableCellsIcon className="w-4 h-4 text-content/95 flex-shrink-0" />
    )}
    <span className="font-mono text-[12.5px] font-semibold truncate">
      {fileName}
    </span>
    <span className="text-[11.5px] text-content/95 flex-shrink-0">
      {counts}
    </span>
    <div className="flex-1" />
    <span className="text-[11.5px] text-content/95 flex-shrink-0">
      {status}
    </span>
  </div>
);

export default PreviewHeader;
